

// Assumed Target already set
var completePathToFile = "$000";
var knownImageScale = $001;
ImageLink.pathToFITS = completePathToFile;
ImageLink.scale = knownImageScale;
ImageLink.execute();
scale=ImageLinkResults.imageScale;
ang=ImageLinkResults.imagePositionAngle;
Ra=ImageLinkResults.imageCenterRAJ2000;
Dec=ImageLinkResults.imageCenterDecJ2000;
Out="Success|"+String(scale) + "|" + String(Ra) + "|" + String(Dec) + "|" + String(ang);
