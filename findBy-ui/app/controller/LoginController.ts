///<reference path="Reference.ts" />
module TrialControllers {
    export class LoginController {
        navigateToSignup: () => void;
        login: (entity: any) => void;
        entity: { userName: string, password: string };
        cancel:()=>void;
        static $inject = ["$state", "Restangular", "$stateParams"];
        constructor($state, restangular, $stateParams) {
            var vm: any = this;
            init();
            function init() {
                populateUserData();
                vm.navigateToSignup = clickToSignUp;
                vm.login = clickToLogin;
                vm.cancel=oncancelling;
            }
            function oncancelling(){
                vm.entity={userName:"",password:""};
            }
            function populateUserData() {
                if ($stateParams.id != null) {
                    restangular.all('userAccounts').get($stateParams.id).then((data) => {
                        vm.entity = { userName: data.userName, password: data.password };
                    });
                }
            }
            function clickToSignUp() {
                $state.go("signup");
            }
            function clickToLogin(entity) {
                restangular.all("login").post(entity).then((data) => {
                    localStorage.setItem("apiKey", data.command.token);
                    localStorage.setItem("userId", data.command.userAccountId);
                    
                    $state.go("profile",{count:data.count});
                },(error)=>{
                    alert("user account does not exist");
                });
            }
        }
    }
}