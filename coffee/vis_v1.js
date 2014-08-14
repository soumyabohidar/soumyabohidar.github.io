	var width = 1366,
      height = 830,
      tooltip = CustomTooltip("tooltip", 240),
      layout_gravity = -0.01,
      damper = 0.09,
      nodes = [],
      vis, force, circles, radius_scale;
	  
var custom_bubble_chart = (function(d3, CustomTooltip) {
  "use strict";



  var center = {x: width / 2, y: height / 2};

  var seg_centers = {
      "G500": {x: 1.1 * width / 4, y: height / 3.5},
      "LI": {x: 1.05 * width / 2, y: height / 2.8},
	  "EB": {x: 2.9 * width / 4, y: height / 2.8},
	  "HCLS": {x: 1.1* width / 3.8, y: 2.2 * height / 4},
	  "PPA": {x: 2.2 * width / 4, y: 2.3 * height / 4},
	  "PCA": {x: 2.18 * width / 3, y: 2.68 * height / 4}
    };


  function custom_chart(data) {
    var max_amount = d3.max(data, function(d) { return parseInt(d.Opportunities); } );
	//var max_amount = 2726;
    radius_scale = d3.scale.pow().exponent(.5).domain([0, max_amount]).range([2,70]);

    //create node objects from original data
    //that will serve as the data behind each
    //bubble in the vis, then add each node
    //to nodes to be used later
    data.forEach(function(d){
      var node = {
        id: d.id,
        radius: radius_scale(parseInt(d.Opportunities)),
        value: d.total_amount,
        name: d.string_combination,
        org: d.organization,
        seg: d.segment,
		opps: d.Opportunities,
		color: d.color
      };
      nodes.push(node);
    });

    nodes.sort(function(a, b) {return b.value- a.value; });

    vis = d3.select("#vis").append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("id", "svg_vis");

    circles = vis.selectAll("circle")
                 .data(nodes, function(d) { return d.id ;});

    circles.enter().append("circle")
      .attr("r", 0)
      .attr("fill", function(d) { return d.color ;})
	  .attr("stroke-width", 2)
      .attr("stroke", "gray")
      .attr("id", function(d) { return  "bubble_" + d.id; })
      .on("mouseover", function(d, i) {show_details(d, i, this);})
      .on("mouseout", function(d, i) {hide_details(d, i, this);} );

    circles.transition().duration(2000).attr("r", function(d) { return d.radius; });

  }

  function charge(d) {
    return -Math.pow(d.radius, 2.0) / 8;
  }

  function start() {
    force = d3.layout.force()
            .nodes(nodes)
            .size([width, height]);
  }

  function display_group_all() {
    force.gravity(layout_gravity)
         .charge(charge)
         .friction(0.9)
         .on("tick", function(e) {
            circles.each(move_towards_center(e.alpha))
                   .attr("cx", function(d) {return d.x;})
                   .attr("cy", function(d) {return d.y;});
         });
    force.start();
    hide_seg();
  }

  function move_towards_center(alpha) {
    return function(d) {
      d.x = d.x + (center.x - d.x) * (damper + 0.02) * alpha;
      d.y = d.y + (center.y - d.y) * (damper + 0.02) * alpha;
    };
  }

  function display_by_seg() {
    force.gravity(layout_gravity)
         .charge(charge)
         .friction(0.9)
        .on("tick", function(e) {
          circles.each(move_towards_seg(e.alpha))
                 .attr("cx", function(d) {return d.x;})
                 .attr("cy", function(d) {return d.y;});
        });
    force.start();
    display_seg();
  }

  function move_towards_seg(alpha) {
    return function(d) {
      var target = seg_centers[d.seg];
      d.x = d.x + (target.x - d.x) * (damper + 0.02) * alpha * 1.1;
      d.y = d.y + (target.y - d.y) * (damper + 0.02) * alpha * 1.1;
    };
  }


  function display_seg() {
      var seg_x = {"G500 ($ 364,555)": width / 8, "LI ($ 122,334)": width/2.3, "EB ($ 27,246)": 1000, "HCLS ($ 93,271)": width/8, "PPA ($ 40,855)": width/2.3, "PCA ($ 44,263)": 1000};
	  var seg_y = {"G500 ($ 364,555)": height/25 , "LI ($ 122,334)": height/25 , "EB ($ 27,246)": height/25 , "HCLS ($ 93,271)": height/2.2 , "PPA ($ 40,855)": height/2.2 , "PCA ($ 44,263)": height/2.2};
      var seg_data = d3.keys(seg_x);
      var seg = vis.selectAll(".seg")
                 .data(seg_data);

      seg.enter().append("text")
                   .attr("class", "seg")
                   .attr("x", function(d) { return seg_x[d]; }  )
		           .attr("y", function(d) { return seg_y[d]; }  )
				   .text(function(d) { return d;})
				   .style("font-family","sans-serif")
				   .style("fill","gray");
				   

  }

  function hide_seg() {
      var seg = vis.selectAll(".seg").remove();
  }


  function show_details(data, i, element) {
    d3.select(element).attr("stroke", "black");
    var content = "<span class=\"name\">Touch Points:</span><span class=\"value\"> " + data.name + "</span><br/>";
    content +="<span class=\"name\">Average Pipeline:</span><span class=\"value\"> $" + addCommas(data.value) + "</span><br/>";
    content +="<span class=\"name\">Segment:</span><span class=\"value\"> " + data.seg + "</span<br/><br/>";
	content +="<span class=\"name\"># Opportunities:</span><span class=\"value\"> " + data.opps + "</span<br/>";
    tooltip.showTooltip(content, d3.event);
  }

  function hide_details(data, i, element) {
    d3.select(element).attr("stroke", "gray");
    tooltip.hideTooltip();
  }

  var my_mod = {};
  my_mod.init = function (_data) {
    custom_chart(_data);
    start();
  };

  my_mod.display_all = display_group_all;
  my_mod.display_year = display_by_seg;
  my_mod.toggle_view = function(view_type) {
    if (view_type == 'seg') {
      display_by_seg();
    } else {
      display_group_all();
      }
    };

  return my_mod;
})(d3, CustomTooltip);

var csv_data;
    d3.csv("data/string_analysis.csv", function(data) {
        custom_bubble_chart.init(data);
        custom_bubble_chart.toggle_view('all');
		csv_data = data;
    });

    $(document).ready(function() {
      $('#view_selection a').click(function() {
        var view_type = $(this).attr('id');
        $('#view_selection a').removeClass('active');
        $(this).toggleClass('active');
        custom_bubble_chart.toggle_view(view_type);
        return false;
      });

    });
					 	
/*----------------------------------------------------------------------------------------------------------------------------------------------
		for(i=0;i<csv_data.length;i++) { 
			if(con==="0000000000") {
			d3.selectAll("#bubble_"+csv_data[i].id).attr("fill", function(d) { return d.color ;})
			    									.attr("stroke-width", 2);
			} else if(con!==csv_data[i].EM + csv_data[i].DM + csv_data[i].Events + csv_data[i].LatticePlay + csv_data[i].Trips + csv_data[i].Keep_It + csv_data[i].TnB + csv_data[i].Online + csv_data[i].AccountsPlay + csv_data[i].ThirdParty)	{
				d3.select("#bubble_"+csv_data[i].id).attr("fill","white")
													.attr("stroke", "gray");
			} else {
				d3.select("#bubble_"+csv_data[i].id).attr("fill", csv_data[i].color)
				        							.attr("stroke-width", 2);
			}
		}
	};
		  
	function checkReset(){
	$('input[type=checkbox]').attr('checked',false);
	for(i=0;i<csv_data.length;i++){
		d3.select("#bubble_"+csv_data[i].id).attr("fill", function(d) { return d.color ;})
											.attr("stroke-width", 2);
		};
	};
	 
	function selectAll(){
	$('input[type=checkbox]').attr('checked',true);
	con = "1111111111";
	for(i=0;i<csv_data.length;i++){ 
		if(con!==csv_data[i].EM + csv_data[i].DM + csv_data[i].Events + csv_data[i].LatticePlay + csv_data[i].Trips + csv_data[i].Keep_It + csv_data[i].TnB + csv_data[i].Online + csv_data[i].AccountsPlay + csv_data[i].ThirdParty){
			d3.select("#bubble_"+csv_data[i].id).attr("fill","white")
												.attr("stroke", "gray");
		}else {
			d3.select("#bubble_"+csv_data[i].id).attr("fill", csv_data[i].color)
											.attr("stroke-width", 2);
			}
		}
	};
	 
----------------------------------------------------------------------------------------------------------------------------------------------*/	 	

function remove(arr, item) {
      for(var i = arr.length; i--;) {
          if(arr[i] === item) {
              arr.splice(i, 1);
          }
      }
  }
  


var arr_with=[];  
var arr_without=[];

var check="";
var z=0;
var seeds, tnb;


function allowDrop(ev) {
    ev.preventDefault();
	
}

function drag(ev) {
    ev.dataTransfer.setData("Text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
	var data=ev.dataTransfer.getData("Text");
    ev.target.appendChild(document.getElementById(data));

	if(document.getElementById("seeds").parentNode===document.getElementById("dropbox_w")){
	arr_with.push("seeds");
	remove(arr_without, "seeds");
	}else if(document.getElementById("seeds").parentNode===document.getElementById("dropbox_wo")) {
	arr_without.push("seeds");
	remove(arr_with, "seeds");
	}else if(document.getElementById("seeds").parentNode===document.getElementById("dragbox")) {
	remove(arr_with, "seeds");
	remove(arr_without, "seeds");
	}

	if(document.getElementById("tnb").parentNode===document.getElementById("dropbox_w")){
	arr_with.push("tnb");
	remove(arr_without, "tnb");
	}else if(document.getElementById("tnb").parentNode===document.getElementById("dropbox_wo")) {
	arr_without.push("tnb");
	remove(arr_with, "tnb");
	}else if(document.getElementById("tnb").parentNode===document.getElementById("dragbox")) {
	remove(arr_with, "tnb");
	remove(arr_without, "tnb");
	}

	if(document.getElementById("ap").parentNode===document.getElementById("dropbox_w")){
	arr_with.push("ap");
	remove(arr_without, "ap");
	}else if(document.getElementById("ap").parentNode===document.getElementById("dropbox_wo")) {
	arr_without.push("ap");
	remove(arr_with, "ap");
	}else if(document.getElementById("ap").parentNode===document.getElementById("dragbox")) {
	remove(arr_with, "ap");
	remove(arr_without, "ap");
	}

	if(document.getElementById("em").parentNode===document.getElementById("dropbox_w")){
	arr_with.push("em");
	remove(arr_without, "em");
	}else if(document.getElementById("em").parentNode===document.getElementById("dropbox_wo")) {
	arr_without.push("em");
	remove(arr_with, "em");
	}else if(document.getElementById("em").parentNode===document.getElementById("dragbox")) {
	remove(arr_with, "em");
	remove(arr_without, "em");
	}

	if(document.getElementById("dm").parentNode===document.getElementById("dropbox_w")){
	arr_with.push("dm");
	remove(arr_without, "dm");
	}else if(document.getElementById("dm").parentNode===document.getElementById("dropbox_wo")) {
	arr_without.push("dm");
	remove(arr_with, "dm");
	}else if(document.getElementById("dm").parentNode===document.getElementById("dragbox")) {
	remove(arr_with, "dm");
	remove(arr_without, "dm");
	}

	if(document.getElementById("events").parentNode===document.getElementById("dropbox_w")){
	arr_with.push("events");
	remove(arr_without, "events");
	}else if(document.getElementById("events").parentNode===document.getElementById("dropbox_wo")) {
	arr_without.push("events");
	remove(arr_with, "events");
	}else if(document.getElementById("events").parentNode===document.getElementById("dragbox")) {
	remove(arr_with, "events");
	remove(arr_without, "events");
	}

	if(document.getElementById("lat_play").parentNode===document.getElementById("dropbox_w")){
	arr_with.push("lat_play");
	remove(arr_without, "lat_play");
	}else if(document.getElementById("lat_play").parentNode===document.getElementById("dropbox_wo")) {
	arr_without.push("lat_play");
	remove(arr_with, "lat_play");
	}else if(document.getElementById("lat_play").parentNode===document.getElementById("dragbox")) {
	remove(arr_with, "lat_play");
	remove(arr_without, "lat_play");
	}

	if(document.getElementById("online").parentNode===document.getElementById("dropbox_w")){
	arr_with.push("online");
	remove(arr_without, "online");
	}else if(document.getElementById("online").parentNode===document.getElementById("dropbox_wo")) {
	arr_without.push("online");
	remove(arr_with, "online");
	}else if(document.getElementById("online").parentNode===document.getElementById("dragbox")) {
	remove(arr_with, "online");
	remove(arr_without, "online");
	}


	if(document.getElementById("tp").parentNode===document.getElementById("dropbox_w")){
	arr_with.push("tp");
	remove(arr_without, "tp");
	}else if(document.getElementById("tp").parentNode===document.getElementById("dropbox_wo")) {
	arr_without.push("tp");
	remove(arr_with, "tp");
	}else if(document.getElementById("tp").parentNode===document.getElementById("dragbox")) {
	remove(arr_with, "tp");
	remove(arr_without, "tp");
	}

	if(document.getElementById("trips").parentNode===document.getElementById("dropbox_w")){
	arr_with.push("trips");
	remove(arr_without, "trips");
	}else if(document.getElementById("trips").parentNode===document.getElementById("dropbox_wo")) {
	arr_without.push("trips");
	remove(arr_with, "trips");
	}else if(document.getElementById("trips").parentNode===document.getElementById("dragbox")) {
	remove(arr_with, "trips");
	remove(arr_without, "trips");
	}
	
	
	
    arr_with = arr_with.filter( function( item, index, inputArray ) {
           return inputArray.indexOf(item) == index;
    });
	
    arr_without = arr_without.filter( function( item, index, inputArray ) {
           return inputArray.indexOf(item) == index;
    });	
}

var count =0;
	
function submit() {
check="";
	for (var j=0; j<arr_with.length; j++){
		check = check + 'csv_data[i].'+[arr_with[j]] + "==1 && ";
		}
		
	for (var j=0;j<arr_without.length; j++) {
		check = check + 'csv_data[i].'+[arr_without[j]] + "==0 && ";
		}
	check = check.substring(0,check.length - 4);

	for(i=0;i<=csv_data.length;i++){	
	if(eval(check)!=true){
		d3.select("#bubble_"+csv_data[i].id).attr("fill","white")
										.attr("stroke", "gray");
	} else {
		d3.select("#bubble_"+csv_data[i].id).attr("fill", csv_data[i].color)
				        							.attr("stroke-width", 2);
													
			}
	}
}

	function checkReset(){
		for(i=0;i<csv_data.length;i++){
		d3.select("#bubble_"+csv_data[i].id).attr("fill", function(d) { return d.color ;})
											.attr("stroke-width", 2);
		}
		
	while (document.getElementById("dropbox_w").childNodes.length > 0) {
    document.getElementById("dragbox").appendChild(document.getElementById("dropbox_w").childNodes[0]);
	}

	while (document.getElementById("dropbox_wo").childNodes.length > 0) {
    document.getElementById("dragbox").appendChild(document.getElementById("dropbox_wo").childNodes[0]);
	}
	
	
	arr_with = [];
	arr_without = [];
	
	};