///<reference path="Reference.ts" />
module TrialControllers {
    export class ProfileController {
        static $inject = ["$state", "Restangular", "$stateParams", "$mdDialog", "leafletData"];
        entity: any;
        showEdit: () => void;
        updateDetails: (entity: any) => void;
        resetPassword: (event: any) => void;
        editMode: Boolean;
        logOut: () => void;
        activities: Array<Object>;
        activity: String;
        loadChanges: () => void;
        constructor($state, restangular, $stateParams, $mdDialog, leafletData) {
            var vm: any = this;
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
                restangular.setDefaultHeaders({ apiKey: localStorage.getItem("apiKey") })
                restangular.all("activityTypes").getList().then((data) => {
                    const strippedData = restangular.stripRestangular(data);
                    vm.activities = strippedData;
                })
            }
            function showMap() {
                navigator.geolocation.getCurrentPosition(function (location) {
                    leafletData.getMap().then((map) => {
                        map.setView([location.coords.latitude, location.coords.longitude], 13);
                    });
                    currentLocation = { lat: location.coords.latitude, lng: location.coords.longitude }
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
                        const marker = L.marker([result.geometry.location.lat(), result.geometry.location.lng()]);
                        markers.push({ marker: marker, result: result });
                    });
                    createMarker(markers);
                }
            }
            function getIsOpen(marker) {
                if (marker.result.opening_hours != null) {
                    if (marker.result.opening_hours.open_now) {
                        return "open now"
                    }
                    else {
                        return "closed"
                    }
                } else {
                    return "no opening hours"
                }
            }
            function createMarker(markers) {
                leafletData.getMap().then((map) => {
                    markers.map(function (marker) {
                        const icon = L.icon({
                            iconUrl: marker.result.icon,
                            iconSize: [25, 25]
                        });
                        const isOpen =getIsOpen(marker);
                        const rating = marker.result.rating == null ? "no rating" : marker.result.rating;
                        const photos = marker.result.photos == null ? "no photo" : marker.result.photos[0].html_attributions[0];
                        const popup = "<b>Name:</b>" + marker.result.name + "<br>" +
                            "<b>opening hours:</b>" + isOpen + "<br>" +
                            "<b>Address:</b>" + marker.result.vicinity + "<br>" +
                            "<b>Rating:</b>" + rating + "<br>" +
                            "<b>Photos:" + photos
                        marker.marker.setIcon(icon);
                        marker.marker.bindPopup(popup);
                        map.addLayer(marker.marker);
                    })
                });
            }
            function removeMarker() {
                leafletData.getMap().then((map) => {
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
                restangular.all('userAccounts').get(localStorage.getItem("userId")).then((data) => {
                    const dob = data.dob.split("T")[0]
                    vm.entity = {
                        id: data.id, isDeleted: data.isDeleted,
                        firstName: data.firstName, lastName: data.lastName, userName: data.userName,
                        password: data.password, email: data.email, dob: new Date(dob)
                    };
                });
            }
            function onLoggingOut() {
                restangular.all("logout").get(localStorage.getItem("userId")).then((data) => {
                    localStorage.removeItem("userId");
                    localStorage.removeItem("apiKey");
                    $state.go("login");
                })
            }
            function onShowingEdit() {
                vm.editMode = true;
                if (typeof (vm.entity.dob) == "string") {
                    vm.entity.dob = new Date(vm.entity.dob);
                }
            }
            function onUpdatingDetails(entity) {
                const dataToSend = entity;
                dataToSend.dob = (entity.dob).toISOString().split("T")[0] + "T00:00:00Z";
                restangular.setDefaultHeaders({ apiKey: localStorage.getItem("apiKey") })
                restangular.all("userAccounts").customPUT(dataToSend).then((data) => {
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
    }
}