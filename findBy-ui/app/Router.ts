///<reference path="Reference.ts"/>
module TrialApp {
    export class Router {
        initialize($stateProvider, $urlRouteProvider) {
            $urlRouteProvider.otherwise("/login");
            $stateProvider
                .state('test', {
                    "url": "/test",
                    templateUrl: 'view/test.html',
                    controller: 'AppTrialController as app'
                })
                .state('signup', {
                    "url": "/signup",
                    templateUrl: 'view/signup.html',
                    controller: 'SignUpController as signup'
                })
                .state('login', {
                    "url": "/login?id",
                    templateUrl: 'view/login.html',
                    controller: 'LoginController as login'
                })
                .state('profile', {
                    "url": "/profile?count",
                    templateUrl: 'view/profile.html',
                    controller: 'ProfileController as profile'
                });
        }
    }
}