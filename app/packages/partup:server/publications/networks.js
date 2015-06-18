Meteor.publishComposite('networks.all', function() {
    return {
        find: function() {
            return Networks.find({}, {fields: {description: 1, name: 1, access_level: 1, tags: 1, image: 1}});
        },
        children: [
            {
                find: function(network) {
                    var partups = network.partups || [];

                    return Partups.find({_id: {$in: partups}}, {fields: {name: 1, description: 1}});
                }
            }
        ]
    };
});

Meteor.publish('networks.user', function(userId) {
    var user = Meteor.users.findSinglePublicProfile(userId);
    var userNetworkIds = user.networks || [];
    return Networks.find({$or: [{_id: {$in: userNetworkIds}}, {access_level: 1}]}, {access_level: 1, name: 1});
});

Meteor.publish('networks.list', function() {
    return Networks.find({}, {access_level: 1, name: 1});
});

Meteor.publishComposite('networks.one.partups', function(networkId) {
    return {
        find: function() {
            return Partups.find({'network._id': networkId});
        }
    };
});

Meteor.publishComposite('networks.one.uppers', function(networkId) {
    return {
        find: function() {
            var network = Networks.findOneOrFail(networkId);
            var uppers = network.uppers || [];
            return Meteor.users.findMultiplePublicProfiles(uppers);
        },
        children: [
            {
                find: function(user) {
                    return Images.find({_id: user.profile.image}, {limit: 1});
                }
            }
        ]
    };
});

Meteor.publishComposite('networks.one.pending_uppers', function(networkId) {
    return {
        find: function() {
            var network = Networks.findOneOrFail(networkId);
            var pending_uppers = network.pending_uppers || [];
            return Meteor.users.findMultiplePublicProfiles(pending_uppers);
        },
        children: [
            {
                find: function(user) {
                    return Images.find({_id: user.profile.image}, {limit: 1});
                }
            }
        ]
    };
});

Meteor.publishComposite('networks.one', function(networkId) {
    return {
        find: function() {
            return Networks.find({_id: networkId}, {limit: 1});
        },
        children: [
            {
                find: function(network) {
                    var imageId = network.image || null;
                    return Images.find({_id: imageId}, {limit: 1});
                }
            },
            {
                find: function(network) {
                    var partups = network.partups || [];
                    return Partups.find({_id: {$in: partups}});
                }
            },
            {
                find: function(network) {
                    var uppers = network.uppers || [];
                    return Meteor.users.findMultiplePublicProfiles(uppers);
                },
                children: [
                    {
                        find: function(user) {
                            return Images.find({_id: user.profile.image}, {limit: 1});
                        }
                    }
                ]
            }
        ]
    };
});
