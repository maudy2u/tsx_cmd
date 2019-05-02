# LongLat2TSX.py
#
# This program assumes:
# 	1. TSX is running
# 	2. GPSD is working
# 	3. Mount is not connected
#	4. You known what you are doing - changing Long/Lat at your own risk
#
# To run this program:
#
# python LongLat2TSX.py

# This program is written by Stephen Townsend.
# The python is mainly from the work by Anat Ruangrassamee, Ph.D.
# The javascript scripts are mainly from the work by Ken Sturrock.
#
# 20190501

GPSHost = "localhost"		# localhost is the default, assumed, it needs to point to GPSD
GPSPort = "2947"		# 2947 is the default, it needs to match setting in GPSD
TSXHost = "127.0.0.1"		# You can set this if you want to run the functions remotely
                            	# The "*Remote functions" already handle that internally.
TSXPort = 3040              	# 3040 is the default, it can be changed
BUFFER_SIZE = 1024
CR = "\n"
javaP = "/* Java Script */" + CR
startP = "/* Socket Start Packet */" + CR
endP = "/* Socket End Packet */" +CR

debugMsg = False

import socket
import sys
import httplib, urllib
import gps

def setLongLat( ):
	# Listen on port 2947 (gpsd) of localhost
	session = gps.gps(GPSHost, GPSPort)
	session.stream(gps.WATCH_ENABLE | gps.WATCH_NEWSTYLE)
	report = session.next()
	notFound = True
        NorthOrSouth = 0			# var sk6DocProp_Latitude = 0; // 0=North
        EastOrWest = 0				#var sk6DocProp_Longitude = 1; // 1=West
	try:
		while notFound:
			report = session.next()
			# Wait for a 'TPV' report and display the current time
			# To see all report data, uncomment the line below
			# print report
			if report['class'] == 'TPV':
				print ' '
				print report.time
				print '----------------------------------------'
				print 'latitude    ' , session.fix.latitude;
				print 'longitude   ' , session.fix.longitude
				print 'time utc    ' , session.utc, session.fix.time
				print 'altitude    ' , session.fix.altitude
				print '----------------------------------------'
				notFound = False
                
                lon = session.fix.longitude
                lat = session.fix.latitude
                if lon < 0:
                  NorthOrSouth = 1
                if lat < 0:
                  EastOrWest = 1
		MESSAGE = " \
var Out = 'Success';"+CR+"\
try {"+CR+"\
var sk6DocProp_Latitude = " + str( EastOrWest ) + ";" +CR+"\
var sk6DocProp_Longitude = "+ str ( NorthOrSouth ) + ";"+CR+"\
var sk6DocProp_ElevationInMeters =3;" + CR + "\
var ALT = "+ str ( session.fix.altitude ) + ";"+CR+"\
var LO = Math.abs(" +  str( lon  ) + ");"+CR+"\
var LA = Math.abs(" + str( lat ) + " );"+CR+"\
sky6StarChart.SetDocumentProperty(sk6DocProp_Latitude, LA);"+CR+"\
sky6StarChart.SetDocumentProperty(sk6DocProp_Longitude, LO );"+CR+"\
sky6StarChart.SetDocumentProperty(sk6DocProp_ElevationInMeters, ALT );"+CR+"\
}"+CR+"\
catch (e) {"+CR+"\
Out = 'Failed with ' +  e;"+CR+"\
}"+CR+"\
Out";

		fullMessage =  javaP + MESSAGE + CR
#		fullMessage =  "/* Java Script */" + CR + startP + MESSAGE + CR + endP
		if debugMsg:
			print 'vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv'
			print fullMessage
			print '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^'

		s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		s.connect((TSXHost, TSXPort))
		s.send(fullMessage)
		data = s.recv(BUFFER_SIZE)
		s.close()

		print data
	except KeyError:
		print "GPSD terminated with KeyError"
		pass
	except KeyboardInterrupt:
		print "GPSD terminated via KeyboardInterrupt"
		quit()

	except StopIteration:
		session = None
		print "GPSD has terminated"

	return

def main( ):

    print "<<<<<<<< Script Started >>>>>>>>"
    print "Getting GPS"
    setLongLat()
    print "GPS was set."
    print "<<<<<<<< Script Completed >>>>>>>>"

if __name__ == "__main__":
    main( )
