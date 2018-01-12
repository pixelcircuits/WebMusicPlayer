(function () {
    var app = angular.module('App')
	app.directive('colorpicker', function ($document) {
		function link($scope, element, attrs) {
			function clearSelection() {
				if (window.getSelection) {
					if (window.getSelection().empty) {  // Chrome
						window.getSelection().empty();
					} else if (window.getSelection().removeAllRanges) {  // Firefox
						window.getSelection().removeAllRanges();
					}
				} else if (document.selection) {  // IE?
					document.selection.empty();
				}
			}
			function hsv2rgb(hsv){
				var a = hsv[0]; var b = hsv[1]; var c = hsv[2];
				var h = a; var s = b*c/((a=(2-b)*c)<1?a:2-a); var l = a/2;
				
				var r, g, b;
				if(s == 0){
					r = g = b = l; // achromatic
				}else{
					var hue2rgb = function hue2rgb(p, q, t){
						if(t < 0) t += 1;
						if(t > 1) t -= 1;
						if(t < 1/6) return p + (q - p) * 6 * t;
						if(t < 1/2) return q;
						if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
						return p;
					}
					var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
					var p = 2 * l - q;
					r = hue2rgb(p, q, h + 1/3);
					g = hue2rgb(p, q, h);
					b = hue2rgb(p, q, h - 1/3);
				}
				return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
			}
			function rgb2hsv(rgb){
				var r = rgb[0]; var g = rgb[1]; var b = rgb[2];
				r /= 255, g /= 255, b /= 255;
				var max = Math.max(r, g, b), min = Math.min(r, g, b);
				var h, s, l = (max + min) / 2;

				if(max == min){
					h = s = 0; // achromatic
				}else{
					var d = max - min;
					s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
					switch(max){
						case r: h = (g - b) / d + (g < b ? 6 : 0); break;
						case g: h = (b - r) / d + 2; break;
						case b: h = (r - g) / d + 4; break;
					}
					h /= 6;
				}

				s*=l<.5?l:1-l;
				return[h,2*s/(l+s),l+s];
			}
			
			
			$scope.toRGBText = function(rgb) {
				return 'rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')';
			}
			$scope.toRGBTextHue = function(hsv) {
				var rgb = hsv2rgb([hsv[0], 1, 1]);
				return 'rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')';
			}
			
			
			$scope.hsv = [0, 0, 0];
			$scope.hueChange = function(e) {
				var rect = e.target.getBoundingClientRect();
			
				function mousemove(e, notApply){
					var x = e.pageX;
					if(x<=rect.left) x=rect.left+0.1;
					if(x>rect.right) x=rect.right;
					x -= rect.left;
					
					$scope.hsv[0] = (x/rect.width);
					$scope.rgb = hsv2rgb($scope.hsv);
					
					if(!notApply) $scope.$apply();
					clearSelection();
				}
				function mouseup(e){
					document.removeEventListener("mouseup", mouseup);
					document.removeEventListener("mousemove", mousemove);
				}
				document.addEventListener("mouseup", mouseup);
				document.addEventListener("mousemove", mousemove);
				
				mousemove(e, true);
			}
			$scope.satValChange = function(e) {
				var rect = e.target.getBoundingClientRect();
			
				function mousemove(e, notApply){
					var x = e.pageX;
					if(x<=rect.left) x=rect.left+0.1;
					if(x>rect.right) x=rect.right;
					x -= rect.left;
					
					var y = e.pageY;
					if(y<rect.top) y=rect.top;
					if(y>=rect.bottom) y=rect.bottom-0.1;
					y -= rect.top;
					
					$scope.hsv[1] = (x/rect.width);
					$scope.hsv[2] = ((rect.height-y)/rect.height);
					$scope.rgb = hsv2rgb($scope.hsv);
					
					if(!notApply) $scope.$apply();
					clearSelection();
				}
				function mouseup(e){
					document.removeEventListener("mouseup", mouseup);
					document.removeEventListener("mousemove", mousemove);
				}
				document.addEventListener("mouseup", mouseup);
				document.addEventListener("mousemove", mousemove);
				
				mousemove(e, true);
			}
			$scope.rgbChange = function(i) {
				if(!$scope.rgb[i]) $scope.rgb[i] = 0;
				$scope.hsv = rgb2hsv($scope.rgb);
			}
		}
        return {
			templateUrl: 'webUI/colorpicker/colorpicker.html',
			scope: {
				rgb: "=" 
			},
			link: link
        };
    });
}());