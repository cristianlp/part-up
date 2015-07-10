Meteor.methods({
    /**
     * Add current user contribution to activity
     *
     * @param {string} activityId
     * @param {mixed[]} fields
     */
    'contributions.update': function(activityId, fields) {
        var upper = Meteor.user();
        var activity = Activities.findOneOrFail(activityId);

        if (!upper) throw new Meteor.Error(401, 'Unauthorized.');

        var contribution = Contributions.findOne({activity_id: activityId, upper_id: upper._id});
        var activity = Activities.findOneOrFail(activityId);

        var upperPartups = upper.partups || [];
        var isUpperInPartup = upperPartups.indexOf(activity.partup_id) > -1;

        check(fields, Partup.schemas.forms.contribution);

        try {
            var newContribution = Partup.transformers.contribution.fromFormContribution(fields);

            if (contribution) {
                // Update contribution
                newContribution.updated_at = new Date();
                newContribution.verified = isUpperInPartup;

                // Unarchive contribution if it was archived
                if (contribution.archived) {
                    newContribution.archived = false;
                }

                Contributions.update(contribution._id, {$set: newContribution});

                // Post system message
                var cause = false;

                if (contribution.archived && !newContribution.archived) {
                    cause = 'archived';
                }

                // When there's a cause, it means that the system_message will be created somewhere else
                if (!cause) {
                    Partup.server.services.system_messages.send(upper, activity.update_id, 'system_contributions_updated', {update_timestamp: false});
                }
            } else {
                // Insert contribution
                newContribution.created_at = new Date();
                newContribution.activity_id = activityId;
                newContribution.upper_id = upper._id;
                newContribution.partup_id = activity.partup_id;
                newContribution.verified = isUpperInPartup;

                newContribution._id = Contributions.insert(newContribution);
            }

            return newContribution;
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'Contribution could not be updated.');
        }
    },

    /**
     * Accept a contribution from non partupper and make that user a partupper
     *
     * @param {string} contributionId
     * */
    'contributions.accept': function(contributionId) {
        var upper = Meteor.user();
        var contribution = Contributions.findOneOrFail(contributionId);
        var isUpperInPartup = Partups.findOne({_id: contribution.partup_id, uppers: {$in: [upper._id]}}) ? true : false;

        if (!isUpperInPartup) throw new Meteor.Error(401, 'Unauthorized.');
        var activity = Activities.findOne({_id: contribution.activity_id});

        try {
            // Allowing contribution means that all concept contributions by this user will be allowed
            var conceptContributions = Contributions.find({
                partup_id: activity.partup_id,
                upper_id: contribution.upper_id,
                verified: false
            }, {fields: {_id: 1, update_id: 1}}).fetch();
            var conceptContributionsIdArray = _.pluck(conceptContributions, '_id');

            Contributions.update({_id: {$in: conceptContributionsIdArray}}, {$set: {verified: true}}, {multi: true});

            // Update the update
            var set = {
                upper_id: upper._id,
                type: 'partups_contributions_accepted',
                updated_at: new Date()
            };
            Updates.update({_id: contribution.update_id}, {$set: set});

            // Promote the user from Supporter to Upper
            Partups.update(contribution.partup_id, {$pull: {'supporters': contribution.upper_id}, $push: {'uppers': contribution.upper_id}});
            Meteor.users.update(contribution.upper_id, {$pull: {'supporterOf': contribution.partup_id}, $push: {'upperOf': contribution.partup_id}});

            // Check if the Partup is part of a public Network (automatically join network)
            var partup = Partups.findOne(contribution.partup_id);
            var network = Networks.findOne(partup.network_id);
            if (network && network.isPublic()) {
                Networks.update(network._id, {$push: {uppers: contribution.upper_id}});
                Meteor.users.update(contribution.upper_id, {$push: {networks: network._id}});
            }

            Event.emit('partups.uppers.inserted', contribution.partup_id, contribution.upper_id);
            Event.emit('contributions.accepted', upper._id, contribution.partup_id, contribution.upper_id);

            // Post system message for each accepted contribution
            conceptContributions.forEach(function(contribution) {
                if (contribution.update_id) {
                    Partup.server.services.system_messages.send(upper, activity.update_id, 'system_contributions_accepted', {update_timestamp: false});
                }
            });
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'An error occurred while allowing contributions.');
        }
    },

    /**
     * Reject a concept contribution
     *
     * @param {string} contributionId
     */
    'contributions.reject': function(contributionId) {
        var upper = Meteor.user();
        var contribution = Contributions.findOneOrFail(contributionId);
        var activity = Activities.findOneOrFail(contribution.activity_id);
        var isUpperInPartup = Partups.findOne({_id: contribution.partup_id, uppers: {$in: [upper._id]}}) ? true : false;

        if (!isUpperInPartup) throw new Meteor.Error(401, 'Unauthorized.');

        try {
            // Archive contribution instead of removing
            Contributions.update(contribution._id, {$set: {archived: true}});

            // Post system message
            Partup.server.services.system_messages.send(upper, activity.update_id, 'system_contributions_rejected', {update_timestamp: false});

            Event.emit('partups.contributions.rejected', upper._id, contribution.activity_id, contribution.upper_id);
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'An error occurred while rejecting contribution.');
        }
    },

    /**
     * Archive a Contribution
     *
     * @param {string} contributionId
     */
    'contributions.archive': function(contributionId) {
        var upper = Meteor.user();
        var contribution = Contributions.findOneOrFail(contributionId);
        var activity = Activities.findOneOrFail(contribution.activity_id);

        if (!upper || contribution.upper_id !== upper._id) {
            throw new Meteor.Error(401, 'Unauthorized.');
        }

        try {
            Contributions.update(contribution._id, {$set: {archived: true}});

            // Check if this was the user's last contribution to this Partup. If so, remove from partner list and add as supporter.
            var contributionsLeft = Contributions.find({
                partup_id: contribution.partup_id,
                upper_id: upper._id,
                verified: true,
                archived: {$ne: true}
            }).count();
            if (!contributionsLeft) {
                var partup = Partups.findOneOrFail(contribution.partup_id);
                if (partup.uppers.length > 1) {
                    Partups.update(partup._id, {$pull: {uppers: upper._id}, $push: {supporters: upper._id}});
                    Meteor.users.update(upper._id, {$pull: {upperOf: partup._id}, $push: {supporterOf: partup._id}});
                }
            }

            // Post system message
            Partup.server.services.system_messages.send(upper, activity.update_id, 'system_contributions_removed', {update_timestamp: false});

            Event.emit('partups.contributions.archived', upper._id, contribution);

            return {
                _id: contribution._id
            };
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(500, 'Contribution [' + contributionId + '] could not be archived.');
        }
    },

    /**
     * Remove a Contribution
     *
     * @param {string} contributionId
     */
    'contributions.remove': function(contributionId) {
        var upper = Meteor.user();
        var contribution = Contributions.findOneOrFail(contributionId);
        var activity = Activity.findOneOrFail(contribution.activity_id);

        if (!upper || contribution.upper_id !== upper._id) {
            throw new Meteor.Error(401, 'Unauthorized.');
        }

        try {
            Contributions.remove(contributionId);

            // Post system message
            Partup.server.services.system_messages.send(upper, activity.update_id, 'system_contributions_removed', {update_timestamp: false});

            return {
                _id: contribution._id
            };
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(500, 'Contribution [' + contributionId + '] could not be removed.');
        }
    }

});
