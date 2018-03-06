# PyTSX
#
# To run this program:
#
# python PyTSX.py RA=15.5 DEC=26.5 slot=0,4 bin=1,1 exp=300,300 n_frame=3,4 af_count=3 af_slot=1 af_bin=1 ag_exp=5 ag_delay=30 end_time=5:30
#
# RA       = RA of the target object (hr : floating point).
# DEC      = DEC of the target object (degree : floating point).
# slot     = filter slots (integer). The first slot is 0. Several filter slots can be set. Use commas without whitespace to separate values.
# bin      = bin option for each filter slot (integer). Use commas without whitespace to separate values.
# exp      = exposure time for each filter slot (second : integer).  Use commas without whitespace to separate values.
# n_frame  = number of frames for each filter slot (integer). Use commas without whitespace to separate values.
# af_count = number of frames between autofocus routines (integer).
# af_slot  = filter slot for autofocus (integer). The first slot is 0.
# af_bin   = bin option for autofocus (integer).
# ag_exp   = exposure time for the autoguider (second : integer).
# ag_delay = delay after starting autoguiding (second : integer). This allows the guiding error to settle.
# end_time = Time to end the program (hh:mm, 24hr format). The program will be terminated and the mount will be parked when passing the time. Remove this argument to ignore this limit.
#
# This program is written by Anat Ruangrassamee, Ph.D.
# The javascript scripts are mainly from the work by Ken Sturrock.
#
# 2 March 2017

import socket
import time
import sys
import httplib, urllib
import datetime

def home( ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    sky6RASCOMTele.Connect();\
    sky6RASCOMTele.FindHome();\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    return

def park( ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    sky6RASCOMTele.Connect();\
    sky6RASCOMTele.Park();\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    return

def focus(af_slot,af_bin):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    ccdsoftCamera.Asynchronous = false;\
    ccdsoftCamera.Connect();\
    ccdsoftCamera.focConnect();\
    ccdsoftCamera.filterWheelConnect();\
    ccdsoftCamera.FilterIndexZeroBased = " + str(af_slot) + ";\
    ccdsoftCamera.BinX = " + str(af_bin) + ";\
    ccdsoftCamera.BinY = " + str(af_bin) + ";\
    ccdsoftCamera.AutoSaveOn = true;\
    ccdsoftCamera.AtFocus2();\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    return

def focus_info( ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    focPos = ccdsoftCamera.focPosition;\
    focTemp = ccdsoftCamera.focTemperature;\
    out = focPos + '|' + focTemp + '|(position,temp)';\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    data2 = data.split("|")
    return data2[1]

def slew( RA,DEC ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    var Out;\
    sky6RASCOMTele.Connect();\
    if (sky6RASCOMTele.IsConnected==0)\
    {\
        Out = 'Not connected';\
    }\
    else\
    {\
        sky6RASCOMTele.Asynchronous = false;\
        sky6RASCOMTele.SlewToRaDec(" + str(RA) + "," + str(DEC) + ",'');\
        Out  = 'OK';\
    }\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    return

def AGtakeimage( exp ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    ccdsoftAutoguider.Connect();\
    ccdsoftAutoguider.Asynchronous = false;\
    ccdsoftAutoguider.Frame = 1;\
    ccdsoftAutoguider.Delay = 0;\
    ccdsoftAutoguider.Subframe = false;\
    ccdsoftAutoguider.ExposureTime = " + str(exp) + ";  \
    ccdsoftAutoguider.AutoSaveOn = true;\
    ccdsoftAutoguider.TakeImage();\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    return

def AGfindstar( ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = "/* Java Script */function median(values){values.sort(function(a,b){return a - b;});var half=Math.floor(values.length/2);if(values.length%2){return values[half];}else{return(values[half-1]+values[half])/2.0;}}var CSAGI=ccdsoftAutoguiderImage;CSAGI.AttachToActiveAutoguider();CSAGI.ShowInventory();var X=CSAGI.InventoryArray(0);var Y=CSAGI.InventoryArray(1);var Mag=CSAGI.InventoryArray(2);var Class=CSAGI.InventoryArray(3);var FWHM=CSAGI.InventoryArray(4);var AImage=CSAGI.InventoryArray(5);var BImage=CSAGI.InventoryArray(6);var Theta=CSAGI.InventoryArray(7);var Elong=CSAGI.InventoryArray(8);var disposableX=CSAGI.InventoryArray(0);var disposableY=CSAGI.InventoryArray(1);var disposableMag=CSAGI.InventoryArray(2);var disposableFWHM=CSAGI.InventoryArray(4);var disposableElong=CSAGI.InventoryArray(8);var Width=CSAGI.WidthInPixels;var Height=CSAGI.HeightInPixels;var strResult='';var Brightest=0;var newX=0;var newY=0;var counter=X.length;var medFWHM=median(disposableFWHM);var medMag=median(disposableMag);var medElong=median(disposableElong);var baseMag=medMag;var path='Nothing';median(disposableX);median(disposableY);X.push(0);Y.push(0);X.push(Width);Y.push(Height);Mag.push(medMag,medMag);for(ls=0;ls<counter;++ls){if(((X[ls]>30&&X[ls]<(Width-30)))&&(Y[ls]>30&&Y[ls]<(Height-30))){if((Elong[ls]<medElong*2.5)&&(Mag[ls]<(medMag))){if(FWHM[ls]<(medFWHM*3)&&(FWHM[ls]>1)){var highNeighborX=disposableX[disposableX.indexOf(X[ls])+1];var lowNeighborX=disposableX[disposableX.indexOf(X[ls])-1];var highNeighborY=disposableY[disposableY.indexOf(Y[ls])+1];var lowNeighborY=disposableY[disposableY.indexOf(Y[ls])-1];if(!highNeighborY)highNeighborY=Height;if(!lowNeighborY)lowNeighborY=0;if(!highNeighborX)highNeighborX=Width;if(!lowNeighborX)lowNeighborX=0;var highNeighborXLS=X.indexOf(highNeighborX);var lowNeighborXLS=X.indexOf(lowNeighborX);var highNeighborYLS=Y.indexOf(highNeighborY);var lowNeighborYLS=Y.indexOf(lowNeighborY);if(((X[highNeighborXLS]-X[ls])>20)||(((Y[highNeighborXLS]-Y[ls])>20)&&((Y[ls]-Y[highNeighborXLS])>20))||(Mag[highNeighborXLS]>((Mag[ls]+medMag)/1.75))){if(((X[ls]-X[lowNeighborXLS])>20)||(((Y[lowNeighborXLS]-Y[ls])>20)&&((Y[ls]-Y[lowNeighborXLS])>20))||(Mag[lowNeighborXLS]>((Mag[ls]+medMag)/1.75))){if(((Y[highNeighborYLS]-Y[ls])>20)||(((X[highNeighborYLS]-X[ls])>20)&&((X[ls]-X[highNeighborYLS])>20))||(Mag[lowNeighborYLS]>((Mag[ls]+medMag)/1.75))){if(((Y[ls]-Y[lowNeighborYLS])>20)||(((X[lowNeighborYLS]-X[ls])>20)&&((X[ls]-X[lowNeighborYLS])>20))||(Mag[lowNeighborYLS]>((Mag[ls]+medMag)/1.75))){if(Mag[ls]<baseMag){baseMag=Mag[ls];Brightest=ls;}}}}}}}}}if((ccdsoftAutoguider.ImageUseDigitizedSkySurvey=='1')&&(CSAGI.FITSKeyword('XBINNING')=='1')){newY =(Height-Y[Brightest]);}else{newY=Y[Brightest];}newX=X[Brightest];newX=newX.toFixed(2);newY=newY.toFixed(2);Mag[Brightest]=Mag[Brightest].toFixed(2);newMedMag=medMag.toFixed(2);path=CSAGI.Path;strResult += newX + '|' + newY + '|(X,Y)';strResult+='Mag='+Mag[Brightest]+',';strResult+='MedMag='+newMedMag+',';strResult+='FWHM='+FWHM[Brightest]+',';strResult+='MedFWHM='+medFWHM+',';strResult+='TtlLgtSrcs='+counter+';';strResult+='Path='+path;"
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    data2 = data.split("|")
    return data2[0],data2[1]

def AGstart( starX,starY,exp ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    ccdsoftAutoguider.GuideStarX = " + str(starX) + ";\
    ccdsoftAutoguider.GuideStarY = " + str(starY) + ";\
    ccdsoftAutoguider.AutoguiderExposureTime = " + str(exp) + ";\
    ccdsoftAutoguider.AutoSaveOn = true;\
    ccdsoftAutoguider.Subframe = true;\
    ccdsoftAutoguider.Delay = 0;\
    ccdsoftAutoguider.Frame = 1;\
    ccdsoftAutoguider.Asynchronous = true;\
    ccdsoftAutoguider.Autoguide();\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    return

def AGstop( ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    ccdsoftAutoguider.Abort();\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    return

def AGerror( ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    var errorX = ccdsoftAutoguider.GuideErrorX;\
    var errorY = ccdsoftAutoguider.GuideErrorY;\
    Out = errorX + '|' + errorY;\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    data2 = data.split("|")
    return data2[0],data2[1]

def takeimage( slot,bin,exp ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    ccdsoftCamera.Connect();\
    ccdsoftCamera.Asynchronous = false; \
    ccdsoftCamera.ExposureTime = " + str(exp) + ";  \
    ccdsoftCamera.AutoSaveOn = true;\
    ccdsoftCamera.ImageReduction = 0;   \
    ccdsoftCamera.Frame = 1;\
    ccdsoftCamera.Delay = 2;\
    ccdsoftCamera.Subframe = false;\
    ccdsoftCamera.filterWheelConnect(); \
    ccdsoftCamera.FilterIndexZeroBased = " + str(slot) + ";\
    ccdsoftCamera.BinX = " + str(bin) + ";\
    ccdsoftCamera.BinY = " + str(bin) + ";\
    ccdsoftCamera.TakeImage();\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    s.settimeout(exp+60)
    try:
        data = s.recv(BUFFER_SIZE)
    except socket.error:
        data = "Timeout"
    s.close()
    print "   " + data
    return

def dithering( ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    var minDither = 4;\
    var maxDither = 10;\
    var DitherX = (Math.floor(Math.random() * (maxDither - minDither +1)) + minDither) / 60;\
    var DitherY = (Math.floor(Math.random() * (maxDither - minDither +1)) + minDither) / 60;\
    DitherX = DitherX.toFixed(3);\
    DitherY = DitherY.toFixed(3);\
    var HMSX=DitherX * 60;\
    var HMSY=DitherY * 60;\
    var NorS = (Math.floor(Math.random() * 2));\
    var EorW = (Math.floor(Math.random() * 2));\
    if ( NorS == '0' ){NorS = 'N';} else {NorS = 'S';}\
    if ( EorW == '0' ){EorW = 'E';} else {EorW = 'W';}\
    sky6RASCOMTele.Connect();\
    if (sky6RASCOMTele.IsConnected==0){\
        Out = 'Not connected';\
    } else {\
        sky6RASCOMTele.Asynchronous = false;\
        sky6RASCOMTele.Jog(DitherX, NorS);\
        sky6RASCOMTele.Jog(DitherY, EorW);\
        Out= HMSX.toFixed(1) + ' arcsec ' + NorS + ', ' + HMSY.toFixed(1) + ' arcsec ' + EorW;\
    }\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    return

def LST( ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    sky6Utils.ComputeLocalSiderealTime();\
    Out=sky6Utils.dOut0;\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    data2 = data.split("|")
    return data2[0]

def mountRADEC( ):
    TCP_IP = '127.0.0.1'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024
    MESSAGE = " \
    /* Java Script */\
    var Out;\
    sky6RASCOMTele.Connect();\
    if (sky6RASCOMTele.IsConnected==0)\
    {\
        Out = 'Not connected';\
    }\
    else\
    {\
        sky6RASCOMTele.GetRaDec();\
        Out  = String(sky6RASCOMTele.dRa) + '|' + String(sky6RASCOMTele.dDec);\
    }\
    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    data2 = data.split("|")
    return data2[0],data2[1]

def main(**kwargs):

    # Key/Token for Pushover notification (For more information, visit https://pushover.net/)
#    PUSHOVER_USER="YOUR_USER_KEY"
#    PUSHOVER_APP="YOUR_APP_TOKEN"

    # set target RA and DEC
#    target_RA=float(kwargs['RA'])
#    target_DEC=float(kwargs['DEC'])
    # set filter, exposure, and number of frames for main camera
#    slot=kwargs['slot']
#    slot=map(int,slot.split(","))
#    exp=kwargs['exp']
#    exp=map(int,exp.split(","))
#    n_frame=kwargs['n_frame']
#    n_frame=map(int,n_frame.split(","))
    # set parameters for autofocus
#    af_slot=int(kwargs['af_slot'])
#    af_bin=int(kwargs['af_bin'])
#    af_count=int(kwargs['af_count'])
    # set exposure time of autoguider
#    AG_exp=int(kwargs['ag_exp'])
#    AG_delay=int(kwargs['ag_delay'])
    # set ending time
#    if 'end_time' in kwargs:
#        hour=int(kwargs['end_time'].split(":")[0])
#        minute=int(kwargs['end_time'].split(":")[1])
#        end_time=hour+minute/60.
#        if (end_time < 8) : end_time=end_time+24
#    else:
#        end_time=99

#    count=0

    # START
#    print "<<<<<<<< Script Started >>>>>>>>"
#    print "Finding home"
#    home()
#    print "Mount was homed."
#    print "Slewing to the target."
#    slew(target_RA,target_DEC)
#    print "The target was reached."
#    print "-----------------------------------------------------------------"
#    print datetime.datetime.now()

#    for i_slot in range(len(slot)):

#        print "Slot# " + str(slot[i_slot])

#        for n in range(n_frame[i_slot]):

#            if (count%af_count==0) :
#                print "Autofocus started."
#                focus(af_slot,af_bin)
#                foc_temp=focus_info()
#                print "Autofocus completed."

#            print "Slewing to the target."
#            print "The target was reached."
#            dithering()
#            print "Dithering done."
#            print "Autoguiding started."
#            AGtakeimage(AG_exp)
#            guidestar=AGfindstar()
#            AGstart(guidestar[0],guidestar[1],AG_exp)
#            time.sleep(AG_delay)
#            print "Frame# " + str(n+1) + " of " + str(n_frame[i_slot]) + " started"
#            print "Exposure time = " + str(exp[i_slot]) + " sec"
#            takeimage (slot[i_slot],bin[i_slot],exp[i_slot])
#            AGstop()
#            print "Frame# " + str(n+1) + " of " + str(n_frame[i_slot]) + " completed"
#            print "Autoguiding stopped."
#            print "-----------------------------------------------------------------"
#            print datetime.datetime.now()
#            count=count+1

#            cur_time=datetime.datetime.now().hour+datetime.datetime.now().minute/60.
#            if (cur_time < 8) : cur_time=cur_time+24
#            if cur_time > end_time : break

#        if cur_time > end_time :
#            print "***** Ending time was reached. *****"
#            break

#    print "Parking"
#    park()
#    print "Mount was parked."
#    print "<<<<<<<< Script Completed >>>>>>>>"

    # Send notification
#    conn = httplib.HTTPSConnection("api.pushover.net:443")
#    conn.request("POST", "/1/messages.json",
#      urllib.urlencode({
#        "token": PUSHOVER_APP,
#        "user": PUSHOVER_USER,
#        "message": "TSX script was completed.",
#      }), { "Content-type": "application/x-www-form-urlencoded" })
#    conn.getresponse()
    TCP_IP = '10.9.8.17'
    TCP_PORT = 3040
    BUFFER_SIZE = 1024

    MESSAGE = " \
    /* Java Script */\
    ccdsoftCamera.Status;\
    "
#    var CoordsHMSNow = "";\
#    var CoordsHMS2k = "";\
#    sky6RASCOMTele.GetRaDec();\
#    sky6Utils.ConvertEquatorialToString(sky6RASCOMTele.dRa, sky6RASCOMTele.dDec, 5);\
#    CoordsHMSNow = sky6Utils.strOut;\
#    sky6Utils.PrecessNowTo2000( sky6RASCOMTele.dRa, sky6RASCOMTele.dDec);\
#    sky6Utils.ConvertEquatorialToString(sky6Utils.dOut0, sky6Utils.dOut1, 5);\
#    CoordsHMS2k = sky6Utils.strOut;\
#    Out= '^          Now - ' + CoordsHMSNow + '\n' + '          j2k - ' + CoordsHMS2k;\
#    "
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((TCP_IP, TCP_PORT))
    s.send(MESSAGE)
    data = s.recv(BUFFER_SIZE)
    s.close()
    print "   " + data
    data2 = data.split("|")
    print data2[0] + "|" + data2[1]

    return data2[0],data2[1]

if __name__ == "__main__":
    kwargs = dict(x.split('=', 1) for x in sys.argv[1:])
    main(**kwargs)
