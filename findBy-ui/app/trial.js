var TrialApp;
(function (TrialApp) {
    var Router = (function () {
        function Router() {
        }
        Router.prototype.initialize = function ($stateProvider, $urlRouteProvider) {
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
        };
        return Router;
    }());
    TrialApp.Router = Router;
})(TrialApp || (TrialApp = {}));
var TrialApp;
(function (TrialApp) {
    var Bootstrapper = (function () {
        function Bootstrapper(module, router) {
            this.module = module;
            this.router = router;
        }
        Bootstrapper.prototype.bootstrap = function () {
            var _this = this;
            this.module.config(["RestangularProvider", "$stateProvider", "$urlRouterProvider", "$httpProvider",
                function (RestangularProvider, $stateProvider, $urlRouterProvider, $httpProvider) {
                    return _this.initializeConfig(RestangularProvider, $stateProvider, $urlRouterProvider, $httpProvider);
                }]);
        };
        Bootstrapper.prototype.initializeConfig = function (RestangularProvider, $stateProvider, $urlRouterProvider, $httpProvider) {
            this.initRestangular(RestangularProvider);
            this.router.initialize($stateProvider, $urlRouterProvider);
        };
        Bootstrapper.prototype.initRestangular = function (RestangularProvider) {
            RestangularProvider.setParentless(true, []);
            RestangularProvider.setBaseUrl("http://localhost:9292/drum");
        };
        return Bootstrapper;
    }());
    TrialApp.Bootstrapper = Bootstrapper;
})(TrialApp || (TrialApp = {}));
var TrialApp;
(function (TrialApp) {
    var App = (function () {
        function App() {
            this.module = angular.module('trialApp', ['trialApp.controllers', 'restangular', 'ui.router',
                'ngAnimate', 'ngAria', 'ngMessages', 'ngMaterial', 'leaflet-directive']);
            var router = new TrialApp.Router();
            var bootstrapper = new TrialApp.Bootstrapper(this.module, router);
            bootstrapper.bootstrap();
        }
        return App;
    }());
    TrialApp.App = App;
    new App();
})(TrialApp || (TrialApp = {}));
var TrialControllers;
(function (TrialControllers) {
    var SignUpController = (function () {
        function SignUpController($state, restangular) {
            var vm = this;
            init();
            function init() {
                vm.signUpUser = createUserAccount;
                vm.cancel = onCancelling;
            }
            function onCancelling() {
                $state.go("login");
            }
            function createUserAccount(entity) {
                entity.dob = (entity.dob).toISOString().split("T")[0] + "T00:00:00Z";
                entity.password = "sdfdf";
                entity.isDeleted = false;
                entity.id = 0;
                restangular.all('userAccounts').post(entity).then(function (data) {
                    console.log(data);
                    $state.go("login", { id: data.id });
                });
            }
        }
        SignUpController.$inject = ["$state", "Restangular"];
        return SignUpController;
    }());
    TrialControllers.SignUpController = SignUpController;
})(TrialControllers || (TrialControllers = {}));
var TrialControllers;
(function (TrialControllers) {
    var LoginController = (function () {
        function LoginController($state, restangular, $stateParams) {
            var vm = this;
            init();
            function init() {
                populateUserData();
                vm.navigateToSignup = clickToSignUp;
                vm.login = clickToLogin;
                vm.cancel = oncancelling;
            }
            function oncancelling() {
                vm.entity = { userName: "", password: "" };
            }
            function populateUserData() {
                if ($stateParams.id != null) {
                    restangular.all('userAccounts').get($stateParams.id).then(function (data) {
                        vm.entity = { userName: data.userName, password: data.password };
                    });
                }
            }
            function clickToSignUp() {
                $state.go("signup");
            }
            function clickToLogin(entity) {
                restangular.all("login").post(entity).then(function (data) {
                    localStorage.setItem("apiKey", data.command.token);
                    localStorage.setItem("userId", data.command.userAccountId);
                    $state.go("profile", { count: data.count });
                }, function (error) {
                    alert("user account does not exist");
                });
            }
        }
        LoginController.$inject = ["$state", "Restangular", "$stateParams"];
        return LoginController;
    }());
    TrialControllers.LoginController = LoginController;
})(TrialControllers || (TrialControllers = {}));
var TrialControllers;
(function (TrialControllers) {
    var ProfileController = (function () {
        function ProfileController($state, restangular, $stateParams, $mdDialog, leafletData) {
            var vm = this;
            var currentLocation;
            var googleMap;
            var markers = [];
            init();
            function init() {
                showUserCount();
                getUserDetails();
                getActivities();
                showMap();
                vm.editMode = false;
                vm.showEdit = onShowingEdit;
                vm.updateDetails = onUpdatingDetails;
                vm.logOut = onLoggingOut;
                vm.resetPassword = onResettingPassword;
                vm.loadChanges = onLoadingChanges;
            }
            function getActivities() {
                restangular.setDefaultHeaders({ apiKey: localStorage.getItem("apiKey") });
                restangular.all("activityTypes").getList().then(function (data) {
                    var strippedData = restangular.stripRestangular(data);
                    vm.activities = strippedData;
                });
            }
            function showMap() {
                navigator.geolocation.getCurrentPosition(function (location) {
                    leafletData.getMap().then(function (map) {
                        map.setView([location.coords.latitude, location.coords.longitude], 13);
                    });
                    currentLocation = { lat: location.coords.latitude, lng: location.coords.longitude };
                    googleMap = new google.maps.Map(document.getElementById('map'), {
                        center: currentLocation,
                        zoom: 15
                    });
                });
            }
            function loadNearestPlaces(pyrmont, callback, map, activityType) {
                var service = new google.maps.places.PlacesService(map);
                service.nearbySearch({
                    location: pyrmont,
                    radius: 2000,
                    type: [activityType]
                }, callback);
            }
            function onLoadingPlaces(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    results.map(function (result) {
                        var marker = L.marker([result.geometry.location.lat(), result.geometry.location.lng()]);
                        markers.push({ marker: marker, result: result });
                    });
                    createMarker(markers);
                }
            }
            function getIsOpen(marker) {
                if (marker.result.opening_hours != null) {
                    if (marker.result.opening_hours.open_now) {
                        return "open now";
                    }
                    else {
                        return "closed";
                    }
                }
                else {
                    return "no opening hours";
                }
            }
            function createMarker(markers) {
                leafletData.getMap().then(function (map) {
                    markers.map(function (marker) {
                        var icon = L.icon({
                            iconUrl: marker.result.icon,
                            iconSize: [25, 25]
                        });
                        var isOpen = getIsOpen(marker);
                        var rating = marker.result.rating == null ? "no rating" : marker.result.rating;
                        var photos = marker.result.photos == null ? "no photo" : marker.result.photos[0].html_attributions[0];
                        var popup = "<b>Name:</b>" + marker.result.name + "<br>" +
                            "<b>opening hours:</b>" + isOpen + "<br>" +
                            "<b>Address:</b>" + marker.result.vicinity + "<br>" +
                            "<b>Rating:</b>" + rating + "<br>" +
                            "<b>Photos:" + photos;
                        marker.marker.setIcon(icon);
                        marker.marker.bindPopup(popup);
                        map.addLayer(marker.marker);
                    });
                });
            }
            function removeMarker() {
                leafletData.getMap().then(function (map) {
                    markers.map(function (marker) {
                        map.removeLayer(marker.marker);
                    });
                    markers = [];
                });
            }
            function onLoadingChanges() {
                if (vm.activity.id == 1) {
                    removeMarker();
                    loadNearestPlaces(currentLocation, onLoadingPlaces, googleMap, "restaurant");
                }
                else if (vm.activity.id == 2) {
                    removeMarker();
                    loadNearestPlaces(currentLocation, onLoadingPlaces, googleMap, "shopping_mall");
                }
                else if (vm.activity.id == 3) {
                    removeMarker();
                    loadNearestPlaces(currentLocation, onLoadingPlaces, googleMap, "hair_care");
                }
                else if (vm.activity.id == 4) {
                    removeMarker();
                    loadNearestPlaces(currentLocation, onLoadingPlaces, googleMap, "hospital");
                }
                else if (vm.activity.id == 5) {
                    removeMarker();
                    loadNearestPlaces(currentLocation, onLoadingPlaces, googleMap, "store");
                }
                else if (vm.activity.id == 7) {
                    removeMarker();
                    loadNearestPlaces(currentLocation, onLoadingPlaces, googleMap, "spa");
                }
                else if (vm.activity.id == 8) {
                    removeMarker();
                    loadNearestPlaces(currentLocation, onLoadingPlaces, googleMap, "night_club");
                }
                else if (vm.activity.id == 9) {
                    removeMarker();
                    loadNearestPlaces(currentLocation, onLoadingPlaces, googleMap, "atm");
                }
                else if (vm.activity.id == 10) {
                    removeMarker();
                    loadNearestPlaces(currentLocation, onLoadingPlaces, googleMap, "laundry");
                }
                else if (vm.activity.id == 11) {
                    removeMarker();
                    loadNearestPlaces(currentLocation, onLoadingPlaces, googleMap, "library");
                }
                else if (vm.activity.id == 12) {
                    removeMarker();
                    loadNearestPlaces(currentLocation, onLoadingPlaces, googleMap, "amusement_park");
                }
            }
            function showUserCount() {
                if ($stateParams.count != null && $stateParams.count == 0) {
                    alert("please login and change your password");
                }
            }
            function getUserDetails() {
                restangular.all('userAccounts').get(localStorage.getItem("userId")).then(function (data) {
                    var dob = data.dob.split("T")[0];
                    vm.entity = {
                        id: data.id, isDeleted: data.isDeleted,
                        firstName: data.firstName, lastName: data.lastName, userName: data.userName,
                        password: data.password, email: data.email, dob: new Date(dob)
                    };
                });
            }
            function onLoggingOut() {
                restangular.all("logout").get(localStorage.getItem("userId")).then(function (data) {
                    localStorage.removeItem("userId");
                    localStorage.removeItem("apiKey");
                    $state.go("login");
                });
            }
            function onShowingEdit() {
                vm.editMode = true;
                if (typeof (vm.entity.dob) == "string") {
                    vm.entity.dob = new Date(vm.entity.dob);
                }
            }
            function onUpdatingDetails(entity) {
                var dataToSend = entity;
                dataToSend.dob = (entity.dob).toISOString().split("T")[0] + "T00:00:00Z";
                restangular.setDefaultHeaders({ apiKey: localStorage.getItem("apiKey") });
                restangular.all("userAccounts").customPUT(dataToSend).then(function (data) {
                    vm.editMode = false;
                });
            }
            function onResettingPassword(ev) {
                var confirm = $mdDialog.prompt()
                    .title('Change Password')
                    .placeholder('New Password')
                    .ariaLabel('New Password')
                    .initialValue(vm.entity.password)
                    .targetEvent(ev)
                    .ok('Chage')
                    .cancel('Cancel');
                $mdDialog.show(confirm).then(function (result) {
                    vm.entity.password = result;
                    onUpdatingDetails(vm.entity);
                }, function () {
                });
            }
        }
        ProfileController.$inject = ["$state", "Restangular", "$stateParams", "$mdDialog", "leafletData"];
        return ProfileController;
    }());
    TrialControllers.ProfileController = ProfileController;
})(TrialControllers || (TrialControllers = {}));
var TrialControllers;
(function (TrialControllers) {
    "use strict";
    var AppTrialController = (function () {
        function AppTrialController(restangular) {
            var vm = this;
            vm.getResponseFromServer = onGetButtonClicked;
            vm.showId = onShowingId;
            function onGetButtonClicked() {
                restangular.all('dm').getList().then(function (data) {
                    vm.showDropdown = true;
                    vm.data = data;
                });
            }
            function onShowingId(id) {
                alert(id);
            }
        }
        AppTrialController.$inject = ['Restangular'];
        return AppTrialController;
    }());
    TrialControllers.AppTrialController = AppTrialController;
})(TrialControllers || (TrialControllers = {}));
angular.module('trialApp.controllers', []).controller(TrialControllers);
//# sourceMappingURL=trial.js.map