import { Meteor } from 'meteor/meteor';


// Assumed Target already set
function tsxCmdFindGuideStar() {
  var Out = '\
  // Ken Sturrock\
  // January 13, 2018\
  var CAGI = ccdsoftAutoguiderImage, CAG = ccdsoftAutoguider;\
  CAGI.AttachToActiveAutoguider();\
  CAGI.ShowInventory();\
  var X = CAGI.InventoryArray(0), Y = CAGI.InventoryArray(1), Mag = CAGI.InventoryArray(2), FWHM = CAGI.InventoryArray(4), Elong = CAGI.InventoryArray(8);\
  var disMag = CAGI.InventoryArray(2), disFWHM = CAGI.InventoryArray(4), disElong = CAGI.InventoryArray(8), Width = CAGI.WidthInPixels, Height = CAGI.HeightInPixels;\
  function median(values)\
  {\
  values.sort( function(a,b) {return a - b;} );\
  var half = Math.floor(values.length/2);\
  if(values.length % 2)\
  {\
  return values[half];\
  } else {\
  return (values[half-1] + values[half]) / 2.0;\
  }\
  }\
  function QMagTest(ls)\
  {\
  var Ix = 0, Iy = 0, Isat = 0, Msat = 0.0;\
  for (Ix = Math.max(0,Math.floor(X[ls]-FWHM[ls]*2+.5)); Ix < Math.min(Width-1,X[ls]+FWHM[ls]*2); Ix++ )\
  {\
  for (Iy = Math.max(0,Math.floor(Y[ls]-FWHM[ls]*2+.5)); Iy < Math.min(Height-1,Y[ls]+FWHM[ls]*2); Iy++ )\
  {\
  if (ImgVal[Iy][Ix] > Msat) Msat = ImgVal[Iy][Ix];\
  if (ImgVal[Iy][Ix] > GuideMax) Isat++;\
  }\
  }\
  if (Isat > 1)\
  {\
  ADUFail = ADUFail + 1;\
  return false;\
  } else {\
  return true;\
  }\
  }\
  var FlipY = "No", Brightest = 0, newX = 0, newY = 0;\
  var counter = X.length, passedLS = 0, ADUFail = 0, medFWHM = median(disFWHM), medMag = median(disMag), medElong = median(disElong), baseMag = medMag;\
  var halfTBX = (CAG.TrackBoxX / 2) + 5, halfTBY = (CAG.TrackBoxY / 2) + 5, distX = 0, distY = 0, pixDist = 0, failCount = 0, magLimit = 0, k = 0;\
  var ImgVal = new Array(Height), Ix, Iy = 0, GuideBits = CAGI.FITSKeyword("BITPIX"), GuideCamMax = Math.pow(2,GuideBits)-1, GuideMax = GuideCamMax * 0.9;\
  for (Ix = 0; Ix < Height; Ix++)\
  {\
  ImgVal[Ix] = CAGI.scanLine(Ix);\
  }\
  var NcrsX = Math.floor(Width/halfTBX+1), NcrsY = Math.floor(Height/halfTBY+1), CrsArray = new Array(NcrsX);\
  for (Ix = 0; Ix < NcrsX; Ix++)\
  {\
    CrsArray[Ix] = new Array(NcrsY);\
    for (Iy = 0; Iy < NcrsY; Iy++) CrsArray[Ix][Iy] = new Array();\
    }\
    for (ls = 0; ls < counter; ls++) {\
    Ix = Math.floor(X[ls]/halfTBX);\
    Iy = Math.floor(Y[ls]/halfTBY);\
    CrsArray[Ix][Iy].push(ls);\
    }\
    function QNeighbourTest(ls)\
    {\
    var Ix, Iy, Is, MagLimit = (Mag[ls] + medMag) / 2.5, distX, distY, pixDist, Nstar, Istar;\
    var Isx = Math.floor(X[ls]/halfTBX), Isy = Math.floor(Y[ls]/halfTBY), Ixmin = Math.max(0,Isx-1);\
    var Ixmax = Math.min(NcrsX-1,Isx+1), Iymin = Math.max(0,Isy-1),Iymax = Math.min(NcrsY-1,Isy+1);\
    for (Ix = Ixmin; Ix < Ixmax; Ix++) {\
    for (Iy = Iymin; Iy < Iymax; Iy++) {\
    Nstar = CrsArray[Ix][Iy].length;\
    for (Is = 0; Is < Nstar; Is++) {\
    Istar = CrsArray[Ix][Iy][Is];\
    if (Istar != ls) {\
    distX = Math.abs(X[ls] - X[Istar]);\
    distX = distX.toFixed(2);\
    distY = Math.abs(Y[ls] - Y[Istar]);\
    distY = distY.toFixed(2);\
    pixDist = Math.sqrt((distX * distX) + (distY * distY));\
    pixDist = pixDist.toFixed(2);\
    if (  distX > halfTBX ||  distY > halfTBY || Mag[k] > MagLimit) {\
    return (true);\
    } else {\
    return (false);\
    }\
    }\
    }\
    }\
    }\
    return (true);\
    }\
    for (ls = 0; ls < counter; ++ls)\
    {\
    if ( Mag[ls] < medMag )\
    {\
    if (((X[ls] > 30 && X[ls] < (Width - 30))) && (Y[ls] > 30 && Y[ls] < (Height - 30)))\
    {\
    if ((Elong[ls] < medElong * 2.5))\
    {\
    if (FWHM[ls] < (medFWHM * 2.5) && (FWHM[ls] > 1))\
    {\
    if ( QMagTest(ls) ) {\
    if ( QNeighbourTest(ls))\
    {\
    passedLS = passedLS + 1;\
    if (Mag[ls] < baseMag)\
    {\
    baseMag = Mag[ls];\
    Brightest = ls;\
    }\
    }\
    }\
    }\
    }\
    }\
    }\
    }\
    if ( CAG.ImageUseDigitizedSkySurvey == "1" )\
    {\
    FlipY = "Yes";\
    var Binned = CAGI.FITSKeyword ("XBINNING");\
    if ( Binned > 1 )\
    {\
    FlipY = "No";\
    }\
    }\
    if (FlipY == "Yes")\
    {\
    newY = (Height - Y[Brightest]);\
    } else {\
    newY = Y[Brightest];\
    }\
    if (FlipY == "Yes")\
    {\
    newY = (Height - Y[Brightest]);\
    } else {\
    newY = Y[Brightest];\
    }\
    newY = newY.toFixed(2);\
    newX = X[Brightest].toFixed(2);\
    medFWHM = medFWHM.toFixed(2);\
    Mag[Brightest] = Mag[Brightest].toFixed(2);\
    newMedMag = medMag.toFixed(2);\
    path = CAGI.Path;\
    out = "Succes|" + newX + "|" + newY + "|" + path;\
  ';
};

/*
*/
