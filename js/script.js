
var siteUrl = "https://cable-tinyantenna.apps.us-west-1.starter.openshift-online.com/"
var user = localStorage.getItem("user");
var userInfo =   localStorage.getItem("userinfo");
if (user != null && typeof user != "undefined" && user != "") user = JSON.parse(user);
if (userInfo != null && typeof userInfo != "undefined" && userInfo != "") userInfo = JSON.parse(userInfo);
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('service-worker.js');
}

//key up/down/right/left event

$(document).on("keyup",function(e){
	
	if(event.which == 38 || event.which == 40 ||event.which == 37 || event.which == 39){
		
		var list =document.querySelectorAll("[tab-index='0']");
		list = Array.prototype.filter.call(list, function(item) {return item.tabIndex >= "0"});
		var currentIndex = list.indexOf(document.activeElement);
		var closestContainer;
		if(currentIndex>-1){
			switch(event.which){
				case 38: //up
					closestContainer = $(document.activeElement).closest(".h-container");
					if(closestContainer && closestContainer.prev()){
						closestContainer.prev().find("[tab-index='0']:first").focus();
					}
					break;
				case 40: //down
				
					closestContainer = $(document.activeElement).closest(".h-container");
					if(closestContainer && closestContainer.next()){
						closestContainer.next().find("[tab-index='0']:first").focus();
					}
					break;
				case 39: //right
					if(currentIndex+1 <list.length){
						$(list[currentIndex+1]).focus();
					}
				
					break;
				case 37: //left
					if(currentIndex-1 >0){
						$(list[currentIndex-1]).focus();
					}
					break;
			}
		}else{
			$("[tab-index='0']:first").focus();
		}
		
	}
		

});


var app = angular.module("tinyAntenna", ['ngMaterial', 'ngMessages', 'ui.router', 'hmTouchEvents', 'ngTouch'])
	.run(['$state', '$rootScope', function ($state, $rootScope) {
		$rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
			var publicPages = ['login', 'signup'];
			if (publicPages.indexOf(toState.name) == -1) {
				if (window.user == null || window.user.token == null || window.user.token == "") {
					// If logged out and transitioning to a logged in page:
					e.preventDefault();
					$state.go('login');
				}

			} else {
				if (window.user != null) {
					e.preventDefault();
					$state.go('channels');
				}
			}
		});
	}])
	.config(function ($stateProvider, $urlRouterProvider) {

		$stateProvider.state('login', {
				url: '/login',
				templateUrl:'template/login.html',
				controller: 'loginController'
			})
			.state('channels', {
				url: '/channels',
				templateUrl:'template/channels.html',
				controller: 'channelsController'
			})
			.state('watch', {
				url: '/watch/:channelId',
				templateUrl:'template/watch.html',
				controller: 'watchController'
			})
			

		$urlRouterProvider.otherwise('/login');

	})
	.factory("helperMethod", ['$mdToast', '$state', function ($mdToast, $state) {
		var factory = {};
		factory.showToast = function (message) {

			$mdToast.show(
				$mdToast.simple()
				.textContent(message)
				.position("bottom")
				.hideDelay(3000)
			);
		}
		factory.logout = function () {
			window.user = null;
			localStorage.setItem("user", null);
			$state.go('login');
		}
		return factory;
	}])
	.controller("mainController", ['$scope', '$mdToast', '$sce', '$mdSidenav', '$rootScope', function ($scope, $mdToast, $sce, $mdSidenav, $rootScope) {

		$scope.isLogin = false;
		$scope.userName = user ? user.name : '';
		$scope.oUser = user;
		$scope.navClose = function () {
			$mdSidenav('left').close();
		};
		$scope.navOpen = function () {
			$mdSidenav('left').open();
		};
		$rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
			$scope.navClose();
			$scope.userName = user ? user.name : '';
		});

	}])
	
	
	
	
	.controller('sideBarController', ['$scope', '$mdSidenav', function ($scope, $mdSidenav) {






	}])

	.controller("channelsController", ["$scope", "$http", "$interval", "$mdDialog", 'helperMethod', '$state', function ($scope, $http, $interval, $mdDialog, helperMethod, $state) {
		$scope.channels= [];
		$scope.languages = [];
		var channelInfo =   localStorage.getItem("channelInfo");
		if (channelInfo != null && typeof channelInfo != "undefined" && channelInfo != ""){
			channelInfo = JSON.parse(channelInfo);
			$scope.channels = channelInfo;
			for(let ch of $scope.channels){
				if($scope.languages.indexOf(ch.channelLanguageId) === -1){
					$scope.languages.push(ch.channelLanguageId);
				}
			}
		}
		
		
		
		$scope.watch= function(index){
			
			var channel = $scope.channels[index];
			$state.go("watch", {
				channelId: channel.channel_id
			});
			
		}
		if($scope.channels.length == 0){
			$http.get(siteUrl + "api/getchannels", {
				params: {
					token: user.token
				},
				data: ""
			}).then(function (response) {
				if (response.data.relogin) {
					helperMethod.logout();
					return;
				}
				if (response.data.success){
					$scope.channels = response.data.result;
					$scope.languages = [];
					for(let ch of $scope.channels){
						if($scope.languages.indexOf(ch.channelLanguageId) === -1){
							$scope.languages.push(ch.channelLanguageId);
						}
					}
					localStorage.setItem("channelInfo", angular.toJson(response.data.result));
					
				}else{
					$scope.channels =[];
				}
			}, function (response) {
	
			});
		}
		

	}])
	
	.controller("watchController", ["$scope", "$http", "$interval", "$mdDialog", 'helperMethod', '$state','$stateParams', function ($scope, $http, $interval, $mdDialog, helperMethod, $state,$stateParams) {
		
		if ($stateParams.channelId == null || $stateParams.channelId == "" || $stateParams.channelId == undefined) {
			$state.go("channels");
		}
		$scope.player = null;
		$scope.ready = false;
		$scope.channelInfo = {};
		$http.get(siteUrl + "api/getchannelurl", {
			params: {
				token: user.token,
				channelId:$stateParams.channelId
			},
			data: ""
		}).then(function (response) {
			if (response.data.relogin) {
				helperMethod.logout();
				return;
			}
			if (response.data.success){
				$scope.channelInfo = response.data.info;
				$scope.ready =true;
				$scope.play();
			}
		}, function (response) {

		});
		
		
		$scope.play = function(url){
			if(!url){
				url =$scope.channelInfo.bitrates.low.replace("http://jiotv.live.cdn.jio.com",siteUrl+"api");
			}else{
				url = url.replace("http://jiotv.live.cdn.jio.com",siteUrl+"api");
			}
			//Clappr.Log.setLevel(0);
			$scope.player = new Clappr.Player({source: url, parentId: "#player",hlsjsConfig:{
					xhrSetup: function(xhr, url) {
						var tsreg = /.ts/i;
						if(tsreg.test(url)){
							url = url.replace(siteUrl+"api/","http://sbglrecdnems03.cdnsrv.jio.com/jiotv.live.cdn.jio.com/");
						}else{
							url =  url+"?channelId="+$stateParams.channelId+"&token="+user.token;
						}
						xhr.open("GET",url, !0);
					  }
			}});
		}

	}])
	
	.controller("loginController", ['$scope', '$http', '$state', 'helperMethod', function ($scope, $http, $state, helperMethod) {
		$scope.user = {
			phone: userInfo?userInfo.phone:"",
			password:userInfo?userInfo.password: "",
			pin:userInfo?userInfo.pin:""
		}

		$scope.$parent.isLogin = true;
		$scope.loading = false;

		$scope.login = function () {

			if ($scope.user.phone != null && typeof $scope.user.phone != "undefined" && $scope.user.phone != "" && $scope.user.password != "" && $scope.user.password != null && typeof $scope.user.password != "undefined") {
				$scope.loading = true;
				$http.post(siteUrl + "authenticate", {
					phone: $scope.user.phone,
					password: $scope.user.password,
					pin:$scope.user.pin
				}).then(function (response) {

					if (response.data.success) {
						window.user = response.data;
						window.userinfo = {};
						window.userinfo.phone = $scope.user.phone;
						window.userinfo.password = $scope.user.password;
						window.userinfo.pin = $scope.user.pin;
						helperMethod.showToast("login successful");
						localStorage.setItem("user", angular.toJson(window.user));
						localStorage.setItem("userinfo", angular.toJson(window.userinfo));
						$state.go('channels');
						$scope.$parent.isLogin = false;
					} else {
						helperMethod.showToast(response.data.message);
					}

				}, function (response) {


				}).finally(function () {

					$scope.loading = false;
				});
			}




		}



	}]);