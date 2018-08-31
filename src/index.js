var Cesium = require('cesium/Cesium');
require('cesium/Widgets/widgets.css');
require('./css/main.css');
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmM2JlYTkxNC0yMDNhLTQzNjQtOWM5OC1lOGQ3YmUyNzZhM2QiLCJpZCI6MjE1MCwiaWF0IjoxNTMxNzY2NTIxfQ.Eu_IofhpqQsb-cw2wMck0D-usoUP1y7eb53m840UxYI'

//////////////////////////////////////////////////////////////////////////
// Base Layer and Initial View Setup
//////////////////////////////////////////////////////////////////////////

// Use mapbox for maptile imagery
var mapbox = new Cesium.MapboxImageryProvider({
    mapId: 'mapbox.dark',
    accessToken: 'pk.eyJ1IjoiamF5YWJ5cmQiLCJhIjoiY2plb3N0cXU4MDcxZjM4cXlpcjU2b2t6YiJ9.VuaMxvWUviMu37oVEP53hA'
});
    var viewer = new Cesium.Viewer('cesiumContainer', {
    	imageryProvider: mapbox,
        scene3DOnly: true,
        selectionIndicator: false,
        baseLayerPicker: false,
        timeline: false,
        animation:false
    });

// Setup initial camera view
var initialPosition = new Cesium.Cartesian3.fromDegrees(-114.038132, 27.678953, 2500000.0);
    var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(0, -65.987, 0.025883251314954971306);
var homeCameraView = {
    destination : initialPosition,
    orientation : {
        heading : initialOrientation.heading,
        pitch : initialOrientation.pitch,
        roll : initialOrientation.roll
    },
    duration : 2.0
};

// initial view and home button view
viewer.scene.camera.setView(homeCameraView);
viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function (e) {
  e.cancel = true;
  viewer.scene.camera.flyTo(homeCameraView);
})


//////////////////////////////////////////////////////////////////////////
// Layer, control, legend setup
//////////////////////////////////////////////////////////////////////////

//// West Region RXLEV ////
// Load data
var westRegionPromise = Cesium.GeoJsonDataSource.load('west_region_topo.json', {
  clampToGround : false,
  stroke: Cesium.Color.fromBytes(255,0,159,255),
  fill: Cesium.Color.fromBytes(240,99,193,150), // default magenta
  strokeWidth: 5.0,
});

// Add data to display, modify each polygon's onClick description
var westRegion, westRegionEntities;
westRegionPromise.then(function(dataSource) {
  // add new entity collection to viewer dataSource to display
  viewer.dataSources.add(dataSource);
  westRegion = dataSource.entities;

  westRegionEntities = dataSource.entities.values;
  for (var i = 0; i < westRegionEntities.length; i++) {
    var entity = westRegionEntities[i];

    // iterate through each actual polygon and modify
    if (Cesium.defined(entity.polygon)) {
      entity.name = entity.properties.Name;
      entity.rxlev = entity.properties._18may_all_rxlev_calc_noze_Mean;

      // update infoBox
      var description = '<table class="cesium-infoBox-defaultTable cesium-infoBox-defaultTable-lighter"><tbody>' +
                '<tr><th>' + "Zip Code" + '</th><td>' + entity.properties.ZIP + '</td></tr>' +
                '<tr><th>' + "Market" + '</th><td>' + entity.properties.Sales_Market + '</td></tr>' +
                '<tr><th>' + "State" + '</th><td>' + entity.properties.State + '</td></tr>' +
                '<tr><th>' + "Mean RXLEV" + '</th><td>' + entity.rxlev + '</td></tr>' +
                '</tbody></table>';
      entity.description = description;
    }
  }
});

// Setup rxlev toggeable: toggling on shows colorcoded rxlev data and also legend
var showRxlevDataElement = document.getElementById('rxlev_show');
function setRxlevMode(evt) {
  evt.stopImmediatePropagation();

  if (showRxlevDataElement.checked) {
    // iterate entities and color
    for (var i = 0; i < westRegionEntities.length; i++) {
      var entity = westRegionEntities[i];

      // iterate through each actual polygon and update color by rxlev mean
      if (Cesium.defined(entity.polygon)) {
        if (entity.rxlev>=-97) {
          entity.polygon.material =Cesium.Color.fromBytes(66,244,128).withAlpha(0.8);
        }
        else if (entity.rxlev>=-107) {
          entity.polygon.material = Cesium.Color.fromBytes(244,244,66).withAlpha(0.8);
        }
        else if (entity.rxlev>=-114) {
          entity.polygon.material = Cesium.Color.fromBytes(224,35,35).withAlpha(0.8);
        }
        else if (entity.rxlev <-114){
          entity.polygon.material = Cesium.Color.fromBytes(124,118,118).withAlpha(0.8);
        }
        // else: omit - just leave it magenta-colored
        entity.polygon.outlineColor = Cesium.Color.BLACK;
      }
    }
    // create and show legend
    var addToLegendElement = document.getElementById('west_rxlev');
    addToLegendElement.insertAdjacentHTML('afterbegin',
      '<table><tbody>' +
      '<tr><td><strong>Rxlev Color Code:</strong></td></tr>' +
      '<tr><td><div class="legend-colored-icon rxlev-green"></div> Greater Than -97</td></tr>' +
      '<tr><td><div class="legend-colored-icon rxlev-yellow"></div> -96 to -107</td></tr>' +
      '<tr><td><div class="legend-colored-icon rxlev-red"></div> -106 to -114</td></tr>' +
      '<tr><td><div class="legend-colored-icon rxlev-gray"></div> Less Than -114</td></tr>' +
      '</tbody></table>');
    //entity.description = "STARLING RXLEV<br> Green: >-97dBM<br> Yellow: -97dBm to -107dBm<br> Red: -107dBm to -114dBm<br>" + "Rxlev: " + parseFloat(entity.rxlev).toFixed(0) + " dBm";
  }
  else {
    // iterate entities and color
    for (var i = 0; i < westRegionEntities.length; i++) {
      var entity = westRegionEntities[i];

      // iterate through each actual polygon and update color
      if (Cesium.defined(entity.polygon)) {
          entity.polygon.material = Cesium.Color.fromBytes(240,99,193,150);
          entity.polygon.outlineColor = Cesium.Color.fromBytes(255,0,159,255);
      }
    }

    //remove legend
    var addToLegendElement = document.getElementById('west_rxlev');
    while (addToLegendElement.firstChild) {
      addToLegendElement.removeChild(addToLegendElement.firstChild);
    }
  }
}

showRxlevDataElement.addEventListener('change', setRxlevMode, true);


//// Open Signal Data ////
// load data, add to viewer, and modify. Hidden until toggled
var openSignalCollection;
fetch('west_osm_v1.json').then((data) => data.json()).then(function(dataSource) {
  openSignalCollection = viewer.entities.add(new Cesium.Entity());
  openSignalCollection.show = false;

  // curate dataSource into entities with data, then add to collection
  for (var i = 0; i < dataSource.length; i++) {
    var entityData = dataSource[i];

    // construct properties for new entity
    var name = entityData.name;
    var tmo_snr = parseFloat(entityData.tmo_snr);
    var tmo_snr_rank = parseInt(entityData.tmo_snr_rank);
    var height = tmo_snr > 0 ? tmo_snr*1000 : 0 // 0 unless tmo_snr has data
    var position = Cesium.Cartesian3.fromDegrees(
      parseFloat(entityData.lon),
      parseFloat(entityData.lat),
      height / 2);
    var color;
    if (tmo_snr_rank === 1) {
      color = Cesium.Color.fromBytes(226, 24, 142);
    }
    else if (tmo_snr_rank === 2) {
      color = Cesium.Color.fromBytes(77,24,155);
    }
    else if (tmo_snr_rank >= 3) {
      color = Cesium.Color.fromBytes(125,219,208);
    }
    var property = new Cesium.PropertyBag({
      tmo_snr_rank: tmo_snr_rank,
      tmo_snr: tmo_snr,
    });
    var description = '<table class="cesium-infoBox-defaultTable cesium-infoBox-defaultTable-lighter"><tbody>' +
      '<tr><th>' + "Zip Code" + '</th><td>' + entityData.zip + '</td></tr>' +
      '<tr><th>' + "Market" + '</th><td>' + entityData.sales_mark + '</td></tr>' +
      '<tr><th>' + "State" + '</th><td>' + entityData.state + '</td></tr>' +
      '<tr><th>' + "SNR" + '</th><td>' + tmo_snr + '</td></tr>' +
      '<tr><th>' + "SNR Rank" + '</th><td>' + tmo_snr_rank + '</td></tr>' +
      '</tbody></table>';

    // setup and add snr data as an entity
    viewer.entities.add(new Cesium.Entity({
      name: name,
      parent: openSignalCollection,
      position: position,
      description: description,
      properties: property,
      cylinder: {
        topRadius: 500,
        bottomRadius: 500,
        length: height,
        material: color
      }
    }));
  }

  // remove the original fetch data, as all of that has been curated into entities
  delete(dataSource);
});

// toolbar and legend controls for op snr Layer
var showOpSnrDataElement = document.getElementById('opensignal_snr_show');
function setOpSnrMode(evt) {
  evt.stopImmediatePropagation();

  if (showOpSnrDataElement.checked) {
    openSignalCollection.show = true;

    // display rank filtering
    document.getElementById('snr_rank_filter').style.display = 'block';


    // create and show legend
    if (document.getElementById('snr_legend') == null) {
      var addToLegendElement = document.getElementById('op_snr');
      addToLegendElement.insertAdjacentHTML('afterbegin',
        '<table id="snr_legend"><tbody>' +
        '<tr><td><strong>OpenSignal SNR Color Code:</strong></td></tr>' +
        '<tr><td><div class="legend-colored-icon op-snr-rank1"></div> Rank 1</td></tr>' +
        '<tr><td><div class="legend-colored-icon op-snr-rank2"></div> Rank 2</td></tr>' +
        '<tr><td><div class="legend-colored-icon op-snr-rank3"></div> Rank 3 or Higher</td></tr>' +
        '</tbody></table>');
    }

    // check for rank filters
    for (var i = 1; i < 4; i++) {
      var rank = document.getElementById('opensignal_snr_show' + i);

      if (rank.checked) {
        for (var j = 0; j < openSignalCollection._children.length; j++) {
          var entity = openSignalCollection._children[j]

          // for rank 4s
          if (i == 3 && entity.properties.tmo_snr_rank > i) {
            entity.show = true;
          }

          if (entity.properties.tmo_snr_rank == i) {
            entity.show = true;
          }
        }
      }
      else {
        for (var j = 0; j < openSignalCollection._children.length; j++) {
          var entity = openSignalCollection._children[j]

          if (i == 3 && entity.properties.tmo_snr_rank > i) {
            entity.show = false;
          }

          if (entity.properties.tmo_snr_rank == i) {
            entity.show = false;
          }
        }
      }
    }

  }
  else {
    document.getElementById('snr_rank_filter').style.display = 'none';
    openSignalCollection.show = false;

    // remove legend content
    var addToLegendElement = document.getElementById('op_snr');
    while (addToLegendElement.firstChild) {
      addToLegendElement.removeChild(addToLegendElement.firstChild);
    }
  }
}

showOpSnrDataElement.addEventListener('change', setOpSnrMode, true);
document.getElementById('opensignal_snr_show1').addEventListener('change', setOpSnrMode, true);
document.getElementById('opensignal_snr_show2').addEventListener('change', setOpSnrMode, true);
document.getElementById('opensignal_snr_show3').addEventListener('change', setOpSnrMode, true);


//// LA Building Polygons & OSM data
var laBuildingOSMPromise = Cesium.GeoJsonDataSource.load('final_la_v1.json', {
  clampToGround : false,
  stroke: Cesium.Color.BLACK,
  fill: Cesium.Color.WHITE, // default magenta
  strokeWidth: 15.0,
});

// Add data to display, modify each polygon's onClick description
var laBuildingOSM, laBuildingOSMEntities;
laBuildingOSMPromise.then(function(dataSource) {
  // add new entity collection to viewer dataSource to display
  viewer.dataSources.add(dataSource);
  laBuildingOSM = dataSource.entities;

  laBuildingOSMEntities = dataSource.entities.values;
  for (var i = 0; i < laBuildingOSMEntities.length; i++) {
    var entity = laBuildingOSMEntities[i];

    // iterate through each actual polygon and modify
    if (Cesium.defined(entity.polygon)) {
      entity.name = entity.properties.NETWORK_NA;
      //entity.polygon.height = 450;
    }
  }
});


//// SF Building Polygons & OSM data
// var sfBuildingOSMPromise = Cesium.GeoJsonDataSource.load('final_sf_v1.json', {
//   clampToGround : false,
//   stroke: Cesium.Color.BLACK,
//   fill: Cesium.Color.WHITE, // default magenta
//   strokeWidth: 15.0,
// });
//
// // Add data to display, modify each polygon's onClick description
// var sfBuildingOSM, sfBuildingOSMEntities;
// sfBuildingOSMPromise.then(function(dataSource) {
//   console.log(dataSource);
//   console.log("SF buildign entity count:" + dataSource.entities.values.length);
//
//   // add new entity collection to viewer dataSource to display
//   viewer.dataSources.add(dataSource);
//   sfBuildingOSM = dataSource.entities;
//
//   sfBuildingOSMEntities = dataSource.entities.values;
//   for (var i = 0; i < sfBuildingOSMEntities.length; i++) {
//     var entity = sfBuildingOSMEntities[i];
//
//     // iterate through each actual polygon and modify
//     if (Cesium.defined(entity.polygon)) {
//       entity.name = entity.properties.NETWORK_NA;
//       //entity.polygon.height = 450;
//     }
//   }
// });


//// Setup for slider bar to filter based on values available
var rxlevRange = -130;
var snrRange = 35;
// this viewModel holds all variables needed to communicate to HTML side
var viewModel = {
  rxlevRange: rxlevRange,
  snrRange: snrRange
}
// knockout to track variables from JS side
Cesium.knockout.track(viewModel);
// bind parent element so all children are tracked
var menu = document.getElementById('menu');
Cesium.knockout.applyBindings(viewModel, menu);

// getObservable: essentially observe element with data-bind for any changes then runs fcn
Cesium.knockout.getObservable(viewModel, 'snrRange').subscribe(
  function(input) {
    for (var i = 0; i < openSignalCollection._children.length; i++) {
      var entity = openSignalCollection._children[i]

      if (entity.properties.tmo_snr > input) {
        entity.show = false;
      }
      else {
        entity.show = true;
      }
    }
  }
);

Cesium.knockout.getObservable(viewModel, 'rxlevRange').subscribe(
  function(input) {
    for (var i = 0; i < westRegionEntities.length; i++) {
      var entity = westRegionEntities[i];

      if (Cesium.defined(entity.polygon)) {
        if (entity.rxlev <= input) {
          entity.show = false;
        }
        else {
          entity.show = true;
        }
      }
    }
  }
);
