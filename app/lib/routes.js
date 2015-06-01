/*************************************************************/
/* Router Helpers */
/*************************************************************/
// if more than one route needs the same settings (for Abstract route behaviour)
// Redirects cause buggy browser back button
var settingsWithName = function(settingsObj, name){
    settingsObj.name = name;
    return settingsObj;
};

/*************************************************************/
/* Home */
/*************************************************************/
Router.route('/', {
    name: 'home',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'app':      { to: 'main' },
        'app_home': { to: 'page-app' }
    },
    subscriptions: function () {
        this.subscribe('notifications.user');
        this.subscribe('partups.all');
    }
});

/*************************************************************/
/* Discover */
/*************************************************************/
Router.route('/discover', {
    name: 'discover',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'app':          { to: 'main' },
        'app_discover': { to: 'page-app' }
    },
    subscriptions: function () {
        this.subscribe('notifications.user');
        this.subscribe('partups.all');
        this.subscribe('images.all');
    }
});

/*************************************************************/
/* Profile */
/*************************************************************/
var profileSettings = {
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'app': { to: 'main' },
        'PagesProfile': { to: 'page-app' }
    },
    subscriptions: function () {
        this.subscribe('notifications.user');
        this.subscribe('partups.all');
    },
    onBeforeAction: function(){
        if(!this.params._id){
            this.params._id = Meteor.userId();
        }
        this.next();
    }
};
// Abstract route behaviour, redirects cause buggy back buttons in browser
Router.route('/profile', settingsWithName(profileSettings, 'profile'));
Router.route('/profile/:_id', settingsWithName(profileSettings, 'profile-detail'));



/*************************************************************/
/* Partup detail */
/*************************************************************/
var partupSettings = {
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'app':                { to: 'main' },
        'app_partup':         { to: 'page-app' },
        'app_partup_updates': { to: 'page-partup' }
    },
    subscriptions: function () {
        var partupId = this.params._id;

        this.subscribe('notifications.user');
        this.subscribe('partups.one', partupId);
        this.subscribe('partups.one.updates', partupId);
        this.subscribe('partups.one.activities', partupId);
        this.subscribe('partups.one.contributions', partupId);
    },
    data: function() {
        var partup = Partups.findOne({_id: this.params._id});
        var image;
        if(partup) {
            image = Images.findOne({_id: partup.image});
        }
        return {
            partup: partup,
            image: image
        };
    },
    onAfterAction: function() {
        if (!Meteor.isClient) return;

        var partup = this.data().partup;
        if (!partup) return;

        var image = this.data().image;
        var seoMetaData = {
            title: partup.name,
            meta: {
                'title': partup.name,
                'description': partup.description
            }
        };
        if(image) {
            seoMetaData.meta.image = image.url();
        }
        SEO.set(seoMetaData);
    }
};

// this way both /partups/id and partups/id/updates are the default updates page
// Abstract route behaviour, redirects cause buggy back buttons in browser
Router.route('/partups/:_id', settingsWithName(partupSettings, 'partup'));
Router.route('/partups/:_id/updates', settingsWithName(partupSettings, 'partup-updates'));

Router.route('/partups/:_id/updates/:update_id', {
    name: 'partup-update',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'app':               { to: 'main' },
        'app_partup':        { to: 'page-app' },
        'app_partup_update': { to: 'page-partup' }
    },
    subscriptions: function () {
        var partupId = this.params._id;

        this.subscribe('notifications.user');
        this.subscribe('partups.one', partupId);
        this.subscribe('partups.one.updates', partupId);
        this.subscribe('partups.one.activities', partupId);
        this.subscribe('partups.one.contributions', partupId);
    },
    data: function() {
        var partup = Partups.findOne({_id: this.params._id});
        var image;
        if(partup) {
            image = Images.findOne({_id: partup.image});
        }
        return {
            partup: partup,
            image: image
        };
    }
});

Router.route('/partups/:_id/activities', {
    name: 'partup-activities',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'app':                   { to: 'main' },
        'app_partup':            { to: 'page-app' },
        'app_partup_activities': { to: 'page-partup' }
    },
    subscriptions: function () {
        var partupId = this.params._id;

        this.subscribe('notifications.user');
        this.subscribe('partups.one', partupId);
        this.subscribe('partups.one.activities', partupId);
        this.subscribe('partups.one.contributions', partupId);
    },
    data: function() {
        var partup = Partups.findOne({_id: this.params._id});
        var image;
        if(partup) {
            image = Images.findOne({_id: partup.image});
        }
        return {
            partup: partup,
            image: image
        };
    }
});

/*************************************************************/
/* Invite uppers */
/*************************************************************/
Router.route('/partups/:_id/invite', {
    name: 'partup-invite',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'PagesModal': { to: 'main' },
        'PagesPartupInviteUppers': { to: 'modal-page' },
    },
    subscriptions: function () {
        // this.subscribe('users.count');
    }
});

/*************************************************************/
/* Start Partup */
/*************************************************************/
Router.route('/start', {
    name: 'start',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'PagesModal': { to: 'main' },
        'PagesStartPartupIntro': { to: 'modal-page' }
    }
});

Router.route('/start/details', {
    name: 'start-details',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'PagesModal': { to: 'main' },
        'PagesStartPartup': { to: 'modal-page' },
        'PagesStartPartupDetails': { to: 'start-partup-page' }
    },
    subscriptions: function () {
        var partupId = Session.get('partials.start-partup.current-partup');
        this.subscribe('partups.one', partupId);
    }
});

Router.route('/start/:_id/activities', {
    name: 'start-activities',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'PagesModal': { to: 'main' },
        'PagesStartPartup': { to: 'modal-page' },
        'PagesStartPartupActivities': { to: 'start-partup-page' }
    },
    subscriptions: function () {
        this.subscribe('partups.one', this.params._id);
        this.subscribe('partups.one.activities', this.params._id);
        this.subscribe('partups.list');
    },
    action: function() {
        Session.set('partials.start-partup.current-partup', this.params._id);
        this.render();
    }
});

Router.route('/start/:_id/promote', {
    name: 'start-promote',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'PagesModal': { to: 'main' },
        'PagesStartPartup': { to: 'modal-page' },
        'PagesStartPartupPromote': { to: 'start-partup-page' }
    },
    subscriptions: function () {
        this.subscribe('partups.one', this.params._id);
    },
    action: function() {
        Session.set('partials.start-partup.current-partup', this.params._id);
        this.render();
    }
});


/*************************************************************/
/* Login flow */
/*************************************************************/
Router.route('/login', {
    name: 'login',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'PagesModal': { to: 'main' },
        'PagesLogin': { to: 'modal-page' }
    }
});


/*************************************************************/
/* Password reset */
/*************************************************************/
Router.route('/forgot-password', {
    name: 'forgot-password',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'PagesModal': { to: 'main' },
        'PagesForgotPassword': { to: 'modal-page' }
    }
});

Router.route('/reset-password/:token', {
    name: 'reset-password',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'PagesModal': { to: 'main' },
        'PagesResetPassword': { to: 'modal-page' }
    }
});


/*************************************************************/
/* Verify Account */
/*************************************************************/
Router.route('/verify-email/:token', {
    name: 'verify-email',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'app': { to: 'main' }
    },
    onBeforeAction: function () {
        Accounts.verifyEmail(Router.current().params.token, function (error) {
            if(error) {
                Partup.ui.notify.iError('error-ss-invalidEmailVerificationToken');
            } else {
                Partup.ui.notify.iSuccess('error-ss-invalidEmailVerificationToken');
            }

            Router.go('home'); // todo: < change to profile when we have that page
        });
    }
});


/*************************************************************/
/* Register flow */
/*************************************************************/
Router.route('/register', {
    name: 'register',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'PagesModal': { to: 'main' },
        'PagesRegister': { to: 'modal-page' },
        'PagesRegisterRequired': { to: 'register-page' }
    },
    subscriptions: function () {
        this.subscribe('users.count');
    }
});

Router.route('/register/details', {
    name: 'register-details',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'PagesModal': { to: 'main' },
        'PagesRegister': { to: 'modal-page' },
        'PagesRegisterOptional': { to: 'register-page' }
    }
});


/*************************************************************/
/* Styleguide */
/*************************************************************/
Router.route('/styleguide', {
    name: 'styleguide',
    where: 'client',
    layoutTemplate: 'LayoutMain',
    yieldRegions: {
        'app': { to: 'main' },
        'PagesStyleguide': { to: 'page-app' }
    }
});


/*************************************************************/
/* Close route */
/*************************************************************/
Router.route('/close', {
    name: 'close',
    where: 'client',
    onBeforeAction: function () {
        window.close();
    }
});


/*************************************************************/
/* Route protection */
/*************************************************************/
Router.onBeforeAction(function () {
    if (!Meteor.userId()) {
        var route = this.route.getName();
        var params = this.route.params();
        var options = this.route.options;

        Partup.ui.intent.go({ route: 'login' }, function (success) {
            if(success) {
                Router.go(route, params, options);
            } else {
                Partup.ui.intent.executeIntentCallback(route);
            }
        });
    }
    else {
        this.next();
    }
}, {
    only: [
        'start',
        'start-details',
        'start-activities',
        'start-contribute',
        'start-promote',
        'register-details'
    ]
});
// reset start-partup id to reset the start partup flow
Router.onBeforeAction(function () {
    Session.set('partials.start-partup.current-partup', undefined);
    this.next();
}, {
    except: [
        'start-details',
        'start-activities',
        'start-contribute',
        'start-promote'
    ]
});

/*************************************************************/
/* Miscellaneous */
/*************************************************************/
if (Meteor.isClient) {
    Router.onBeforeAction(function() {
        window.scrollTo(0, 0);
        Partup.ui.focuslayer.disable();
        this.next();
    });
}
