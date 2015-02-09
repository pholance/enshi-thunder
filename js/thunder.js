var mapObj;
function init() {
    mapObj = new AMap.Map("container", {
        view: new AMap.View2D({
            center: new AMap.LngLat(109.491923, 30.285888) //地图中心点
        })
    });
    //加载缩放控件
    mapObj.plugin(["AMap.ToolBar"], function() {
        var toolBar = new AMap.ToolBar();
        mapObj.addControl(toolBar);
    });
    //加载比例尺插件  
    mapObj.plugin(["AMap.Scale"], function() {
        scale = new AMap.Scale();
        mapObj.addControl(scale);
    });

    //加载行政区域查询服务
    AMap.service('AMap.DistrictSearch', function() {
        var opts = {
            subdistrict: 1, //返回下一级行政区
            extensions: 'all', //返回行政区边界坐标组等具体信息
            level: 'city'  //查询行政级别为 市
        };

        //实例化DistrictSearch
        var district = new AMap.DistrictSearch(opts);

        //district.setLevel('district');
        district.search('恩施市', function (status, result) {
            if (status == 'complete') {
                var bounds = result.districtList[0].boundaries;
                var polygons = [];
                if (bounds) {
                    for (var i = 0, l = bounds.length; i < l; i++) {
                        //生成行政区划polygon
                        var polygon = new AMap.Polygon({
                            map: mapObj,
                            strokeWeight: 3,
                            path: bounds[i],
                            fillOpacity: 0,
                            strokeColor: '#CC66CC'
                        });
                        polygons.push(polygon);
                    }
                    mapObj.setFitView();//地图自适应
                }
            }
        }); //行政区查询
    });
    createGrid();
//    developerTool();
}
//经度一公里为0.0103933,4公里为0.0415732
//纬度一公里为0.0089818,4公里为0.03592727
/**
 * 创建网格
 * 
 * 经度一公里为0.0103933,4公里为0.0415732
 * 纬度一公里为0.0089818,4公里为0.03592727
 * 初始经纬度为109.085999,29.833496
 */
function createGrid() {
    var beginLng = 109.085999, beginLat = 29.833496;
    var stepLng = 0.0415732, stepLat = 0.03592727;
    mapObj.plugin(["AMap.CloudDataSearch"], function() {
        for (var i = 0; i < 22; i++) {
            var lng = beginLng + (stepLng * i);
            for (var j = 0; j < 24; j++) {
                var lat = beginLat + (stepLat * j);
                var paths = new Array();
                var lb = new AMap.LngLat(lng, lat),
                        lt = new AMap.LngLat(lng, lat + stepLat),
                        rt = new AMap.LngLat(lng + stepLng, lat + stepLat),
                        rb = new AMap.LngLat(lng + stepLng, lat);
                paths.push(lb);
                paths.push(lt);
                paths.push(rt);
                paths.push(rb);
                paths.push(new AMap.LngLat(lng, lat));

                parseGrid(paths);
            }
        }
    });
}


var l = 24 * 6;
function detailReport(cloud) {
    $('#dialog').modal('show');
}
function parseGrid(data) {
    var pageIndex = 1;
    var search = new AMap.CloudDataSearch("538dad43e4b0079b22b52a5f", {
        pageSize: 100,
        pageIndex: pageIndex
    });
    var cloud = new Array();
    AMap.event.addListener(search, "complete", function(e) {
        cloud = cloud.concat(e.datas);
        if (cloud.length < e.count) {
            search.setOptions({
                pageSize: 100,
                pageIndex: ++pageIndex
            });
            search.searchInPolygon(data);
            return;
        }
        var avg = e.count / l;
        var fillColor;
        if (avg >= 0.25 && avg <= 0.5) {
            fillColor = "#BEBEFA";
        } else if (avg > 0.5 && avg <= 0.75) {
            fillColor = "#7F84FA";
        } else if (avg > 0.75 && avg <= 1) {
            fillColor = "#0C45C2";
        } else if (avg > 1 && avg <= 1.25) {
            fillColor = "#D1FD92";
        } else if (avg > 1.25 && avg <= 1.5) {
            fillColor = "#5CFDA9";
        } else if (avg > 1.5 && avg <= 1.75) {
            fillColor = "#22CE6C";
        } else if (avg > 1.75 && avg <= 2) {
            fillColor = "#FEBF7E";
        } else if (avg > 2 && avg <= 2.25) {
            fillColor = "#FFFD89";
        } else if (avg > 2.25 && avg <= 2.5) {
            fillColor = "#DEDE30";
        } else if (avg > 2.5 && avg <= 3) {
            fillColor = "#E0B0D3";
        } else if (avg > 3 && avg <= 5) {
            fillColor = "#FC29F9";
        } else if (avg > 5) {
            fillColor = "#FA101C";
        } else {
            fillColor = "#FFFFFF";
        }

        var grid = new AMap.Polygon({
            map: mapObj,
            path: data,
            strokeWeight: 1,
            fillColor: fillColor,
            fillOpacity: 0.5
        });
        var strength = new Array();
        for (var i = 0; i < cloud.length; i++) {
            strength.push(cloud[i].strength);
        }
        var info = new Array();
        info.push("Ng = " + avg.toFixed(2) + "&nbsp;&nbsp;&nbsp;&nbsp;最大强度：" + Math.max.apply("Math", strength));
        info.push("雷击次数：" + e.count);
        info.push("<b>雷电强度(S)分布：</b>");
        info.push("S&leq;20kA：" + function() {
            var count = 0;
            for (var i = 0; i < strength.length; i++) {
                if (strength[i] > 20) {
                    continue;
                }
                count++;
            }
            return count;
        }() + "次");
        info.push("20kA&lt;S&leq;50kA：" + function() {
            var count = 0;
            for (var i = 0; i < strength.length; i++) {
                if (strength[i] <= 20) {
                    continue;
                }
                if (strength[i] > 50) {
                    continue;
                }
                count++;
            }
            return count;
        }() + "次");
        info.push("50kA&lt;S&leq;100kA：" + function() {
            var count = 0;
            for (var i = 0; i < strength.length; i++) {
                if (strength[i] <= 50) {
                    continue;
                }
                if (strength[i] > 100) {
                    continue;
                }
                count++;
            }
            return count;
        }() + "次");
        info.push("S&gt;100kA：" + function() {
            var count = 0;
            for (var i = 0; i < strength.length; i++) {
                if (strength[i] <= 100) {
                    continue;
                }
                count++;
            }
            return count;
        }() + "次");

        var infoWindow = new AMap.InfoWindow({
            content: info.join("<br>")+'<br><button id="detail" class="btn btn-primary">详细分析报告</button>'
        });
        $('#container').on('click', 'button#detail', function () {
            detailReport(cloud);
        })
        AMap.event.addListener(grid, "click", function(e) {
            infoWindow.open(mapObj, grid.getBounds().getCenter());
        });
    });

    search.searchInPolygon(data); //多边形检索
}

function errorInfo(data) {
    console.log(data.info);
}

function developerTool() {
    //加载距离测量插件
    mapObj.plugin(["AMap.RangingTool"], function() {
        var ruler = new AMap.RangingTool(mapObj);
        AMap.event.addListener(ruler, "addnode", function(e) {
            console.log("经度:" + e.position.getLng() + ";纬度:" + e.position.getLat());
        });
        ruler.turnOn();
    });
    //加载云图层插件
    mapObj.plugin('AMap.CloudDataLayer', function() {
        var layerOptions = {
            clickable: false
        };
        var cloudDataLayer = new AMap.CloudDataLayer('538dad43e4b0079b22b52a5f', layerOptions); //实例化云图层类
        cloudDataLayer.setMap(mapObj);  //叠加云图层到地图
    });
}


