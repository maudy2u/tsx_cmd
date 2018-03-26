

// Assumed Target already set
export function tsxCmdImageLink(completePathToFile, knownImageScale) {
  Out = '\
ImageLink.pathToFITS = '+completePathToFile+';\
ImageLink.scale = '+knownImageScale+';\
ImageLink.execute();\
scale=ImageLinkResults.imageScale;\
ang=ImageLinkResults.imagePositionAngle;\
Ra=ImageLinkResults.imageCenterRAJ2000;\
Dec=ImageLinkResults.imageCenterDecJ2000;\
Out="Success|"+String(scale) + "|" + String(Ra) + "|" + String(Dec) + "|" + String(ang);\
';
return Out;
};
