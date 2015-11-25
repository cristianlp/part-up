var d = Debug('services:profile_completeness');

/**
 @namespace Partup server profile_completeness service
 @name Partup.server.services.profile_completeness
 @memberof Partup.server.services
 */
Partup.server.services.profile_completeness = {
    /**
     * Calculate new profile completeness percentage
     *
     * @param {Object} profile
     */
    calculate: function(profile) {
        var allFields = [
            'name',
            'image',
            'description',
            'tags',
            'location',
            'facebook_url',
            'twitter_url',
            'instagram_url',
            'linkedin_url',
            'phonenumber',
            'website',
            'skype',
            'tiles',
            'meurs'
        ];
        var providedValues = 0;

        _.each(profile, function(value, key) {
            // Don't count empty values
            if (!value || value.length < 1) return;

            // Neglect fields that are not important to this score
            if (allFields.indexOf(key) < 0) return;

            // Handle the special cases
            if (key === 'location' && !value.city) return;
            if (key === 'meurs' && (!value.fetched_results || value.results.length < 1)) return;

            // Valid stuff, add to score count
            providedValues++;
        });

        return Math.round((providedValues * 100) / allFields.length);
    }
};
