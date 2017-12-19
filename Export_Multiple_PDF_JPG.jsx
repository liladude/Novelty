// Export_Multiple.jsx
// An InDesign JavaScript

// Bruno Herfst 2010 - 2017

// Export multiple Files
// with support for covers build with coverbuilder

#target InDesign;

function stripFileName(myString){
    s = myString.replace(/[:\\\/\*\?\"\'<>|]/g,"");
    return s;
}

function seperate(myFileName,extension) {
    if (extension == true){
        return myFileName.replace(/^.*\./,'');
    } else {
        return myFileName.replace(/.[^.]+$/,'');
    }
}

function pageExists( Doc, label ) {
    for (var i=0; Doc.pages.length > i; i++){
        if(Doc.pages[i].label === label){
            return true;
        }
    }
    return false;
}

function getExportRangeByLabel( Doc, label){
    var pagerange = "";
    for (var i=0; Doc.pages.length > i; i++){
        if(Doc.pages[i].label === label){
            pagerange += Doc.pages[i].name + ",";
        }
    }
    if (pagerange.length > 0) {
        pagerange = pagerange.substring(0, pagerange.length - 1);
        return pagerange;
    } else {
        alert("Could not find any pages with label: " + label);
        return "All";
    }
}

function getExportRange( Doc, rangeName ) {
    switch ( rangeName ) {
        case "All Spreads":
        case "All Pages":
            return "All";
            break;
        case "Current Spread":
        case "Current Spread as Pages":
            mySpread = app.activeWindow.activeSpread;
            var myPages = mySpread.pages;
            return myPages[0].name + "-" + myPages[-1].name;
            break;
        case "Spine":
            return getExportRangeByLabel(Doc, "Spine");
            break;
        case "Current Page":
            return app.activeWindow.activePage.name;
            break;
        case "Front Cover":
            return getExportRangeByLabel(Doc, "CVRR");
            break;
        case "Back Cover":
            return getExportRangeByLabel(Doc, "CVRL");
            break;
        default:
            alert("Could not parse page range for: " + rangeName );
            return "All";
            break;
    }
}


function export_jpg( Doc, Preset ){
    // Set Preferences
    app.jpegExportPreferences.antiAlias                   = true;
    app.jpegExportPreferences.embedColorProfile           = true;
    app.jpegExportPreferences.jpegColorSpace              = JpegColorSpaceEnum.RGB;
    app.jpegExportPreferences.jpegRenderingStyle          = JPEGOptionsFormat.BASELINE_ENCODING;
    app.jpegExportPreferences.simulateOverprint           = true;
    app.jpegExportPreferences.useDocumentBleeds           = false;

    switch ( Preset.presetName.replace(/[0-9]/g,'').replace(/ /g,'') ) {
        case "Max":
            app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.MAXIMUM;
            break;
        case "High":
            app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.HIGH;
            break;
        case "Medium":
            app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.MEDIUM;
            break;
        case "Low":
            app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.LOW;
            break;
        default:
            alert("Could not parse quality");
            app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.HIGH;
            break;
    }

    app.jpegExportPreferences.exportResolution = parseInt(Preset.presetName.replace(/[^0-9]/g, ''));

    // Page Range
    var pageRange = getExportRange( Doc, Preset.rangeName );
    if(pageRange === "All") {
        app.jpegExportPreferences.jpegExportRange = ExportRangeOrAllPages.EXPORT_ALL;
    } else {
        app.jpegExportPreferences.jpegExportRange = ExportRangeOrAllPages.EXPORT_RANGE;
        app.jpegExportPreferences.pageString      = pageRange;
    }

    // Spreads
    app.jpegExportPreferences.exportingSpread = Preset.exportSpreads;

    // Document Name
    var SP = "P_"; // Spread or Page
    if( Preset.exportSpreads ){
        SP = "S_";
    }

    var documentNameAddon = "_"+app.jpegExportPreferences.exportResolution+"DPI["+SP+pageRange+"]";

    var myFilePath = Preset.folder + "/" + Preset.documentName + documentNameAddon + ".jpg";
    var myFile = new File(myFilePath);
    Doc.exportFile(ExportFormat.JPG, myFile, false);
}


function export_pdf( Doc, Preset ) {
    try{
        app.pdfExportPresets.item("Export_Multiple.jsx").remove();
    } catch( whatever ) {
        // Just in case application crashes on previous export
    }

    // We need to duplicate the preset so we can make the nececairy changes (Export Spreads)
    var exportPreset = app.pdfExportPresets.item(Preset.presetName).duplicate();
    exportPreset.name = "Export_Multiple.jsx";
    exportPreset.exportReaderSpreads = Preset.exportSpreads;

    // Page Range
    var pageRange = getExportRange( Doc, Preset.rangeName );
    app.pdfExportPreferences.pageRange = pageRange;

    // Document Name
    var SP = "P_"; // Spread or Page
    if( Preset.exportSpreads ){
        SP = "S_";
    }

    var documentNameAddon = "_["+SP+pageRange+"]";

    var myFilePath = Preset.folder + "/" + Preset.documentName + documentNameAddon + ".pdf";
    var myFile = new File(myFilePath);
    Doc.exportFile(ExportFormat.PDF_TYPE, myFile, false, exportPreset );
    exportPreset.remove();
}

function export_Doc( Doc, withPresets ){
    //get the export location
    var myFolder = Folder.selectDialog ("Choose a Folder to save files");
    if(myFolder != null){
        for(var i=0; i<withPresets.length; i++){
            var Preset = withPresets[i];
                Preset.documentName = seperate(Doc.name, false);
                Preset.folder       = myFolder;
            if(Preset.type === 'PDF') {
                export_pdf( Doc, Preset )
            } else if (Preset.type === 'JPG') {
                export_jpg( Doc, Preset );
            }
        }
        alert("Done");
    }
}

function export_UI( Doc, presetData ) {

    function add_group( given_group ) { 
        var group = given_group.panel.add( "panel");
            group.orientation = "row";
            group.alignChildren = "top";

        group.typePresets_drop = group.add("dropDownList",[0,0,50,20], presetData.exportTypes);
        group.typePresets_drop.selection = 0;

        group.pdfPresets_drop = group.add("dropDownList",[0,0,200,20], presetData.pdfPresetNames);
        group.pdfPresets_drop.selection = 0;

        group.page_range_drop = group.add("dropDownList",[0,0,150,20], presetData.pageRangeNames);
        group.page_range_drop.selection = 0;

        group.typePresets_drop.onChange = function() {
            var pdfPresets = this.parent.children[1];
                pdfPresets.removeAll();

            if(this.selection == 1) {
                for (var i = 0; i < presetData.jpgPresetNames.length; i++) { 
                    pdfPresets.add("item", presetData.jpgPresetNames[i]);
                }
                pdfPresets.selection = 6;
            } else {
                for (var i = 0; i < presetData.pdfPresetNames.length; i++) { 
                    pdfPresets.add("item", presetData.pdfPresetNames[i]);
                }
                pdfPresets.selection = 0;
            }
        }

        group.getData = function(){
            var Data = new Object();
            var isSpreadRange = function ( rangeName ) {
                switch ( rangeName ) {
                    case "All Spreads":
                    case "Current Spread":
                        return true;
                        break;
                    case "Spine":
                    case "All Pages":
                    case "Current Spread as Pages":
                    case "Current Page":
                    case "Front Cover":
                    case "Back Cover":
                    case "Spine":
                        return false;
                        break;
                    default:
                        alert("Could not parse rangeName: " + rangeName );
                        return false;
                        break;
                }
            };
            Data.type          = String( group.typePresets_drop.selection );
            Data.presetName    = String( group.pdfPresets_drop.selection  );
            Data.rangeName     = String( group.page_range_drop.selection  );
            Data.exportSpreads = isSpreadRange( Data.rangeName );
            Data.exportRange   = getExportRange(Doc, Data.rangeName);
            return Data;
        }

        // End with Plus and Minus Buttons
        group.index = given_group.panel.children.length - 1;
        group.plus = group.add("button", undefined, "+");
        group.plus.margins = 0;
        group.plus.characters = 1;
        group.plus.preferredSize = [25,25];
        group.plus.onClick = function(){
            add_group( given_group );
        }
        group.minus = group.add("button", undefined, "-");
        group.minus.margins = 0;
        group.minus.characters = 1;
        group.minus.preferredSize = [25,25];
        group.minus.onClick = minus_btn( given_group ); 
        win.layout.layout( true ); 
        return group; 
    }

    function add_btn( given_group ) {
        return function () {
            return add_group( given_group );
        }
    }

    function minus_btn ( given_group ) {
        return function () {   
            var ix = this.parent.index;
            if(ix == 0 && given_group.panel.children.length == 1) {
                // Don't remove the last one
            } else {
                given_group.panel.remove( given_group.panel.children[ix] );    
            }
            // update indexes
            for(var i = 0; i < given_group.panel.children.length; i++){
                given_group.panel.children[i].index = i;
            }
            win.layout.layout( true );
        }
    }

    function create_group(location, groupName){
        // param location: InDesign UI Window, panels or group
        // param group name (string): e.g: "panel" or "group"
        var newGroup                     = new Object();
            newGroup.panel               = location.add(groupName);
            newGroup.panel.orientation   = "column";
            newGroup.panel.alignChildren = "left";
            newGroup.add_btn             = add_btn(newGroup, 0);
            newGroup.minus_btn           = minus_btn(newGroup);
        return newGroup;
    }

    var win = new Window("dialog", "Export Multiple");
        win.orientation = "column";
        win.alignChildren = "left";
        win.margins = 15;
    
    var contentGroup = win.add("group");
        contentGroup.orientation = "row";
        contentGroup.alignChildren = "top";

    var pdfGroup     = create_group(contentGroup, "group");
    var buttonGroup  = create_group(contentGroup, "group");

    buttonGroup.panel.add ("button", undefined, "OK");
    buttonGroup.panel.add ("button", undefined, "Cancel");

    add_group( pdfGroup ); // At least one, otherwise there is nothing to export

    if( win.show() === 1 ) {
        var withPresets = new Array();
        var len = contentGroup.children[0].children.length;
        for(var i = 0; i < len; i++){
            var ui_group = contentGroup.children[0].children[i];
            withPresets.push(ui_group.getData());
        }
        export_Doc( Doc, withPresets );
    } // else user pressed cancel
}

function Export_Multiple() {
    var Doc = app.documents.item(0); // Active Document
    if(!Doc.isValid) {
        alert("Open a document before running this script.");
        return;
    }

    var presetData = new Object();
        presetData.exportTypes    = ["PDF","JPG"];
        presetData.pageRangeNames = ["All Spreads", "All Pages", "Current Spread", "Current Spread as Pages", "Current Page"];
        presetData.jpgPresetNames = ["Max 1200","Max 600","Max 300","Max 100", "High 1200","High 600","High 300","High 100","High 72","Medium 300","Medium 100","Medium 72","Low 300","Low 100","Low 72"];
        presetData.pdfPresetNames = app.pdfExportPresets.everyItem().name;

    if(presetData.pdfPresetNames.length <= 0) {
        alert("Failed to locate PDF presets.");
        return;
    }

    // Let's see if we can add specific cover elements
    // Front Cover, Spine, Back Cover
    if( pageExists( Doc, "CVRR" ) ) {
       presetData.pageRangeNames.push('Front Cover'); 
    }
    if( pageExists( Doc, "Spine" ) ) {
       presetData.pageRangeNames.push('Spine'); 
    }
    if( pageExists( Doc, "CVRL" ) ) {
       presetData.pageRangeNames.push('Back Cover'); 
    }

    export_UI( Doc, presetData);
}

try {
    Export_Multiple();
} catch(err) {
    alert( err.description );
}

