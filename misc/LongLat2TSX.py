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
# 2018-01-20

import socket
import sys
import httplib, urllib
import gps

def setLongLat( ):
	# Listen on port 2947 (gpsd) of localhost
	session = gps.gps("localhost", "2947")
	session.stream(gps.WATCH_ENABLE | gps.WATCH_NEWSTYLE)
	report = session.next()
	notFound = True
	while notFound:
		try:
			report = session.next()
			# Wait for a 'TPV' report and display the current time
			# To see all report data, uncomment the line below
			# print report
			if report['class'] == 'TPV':
				print ' '
				print report.time
				print '----------------------------------------'
				print 'latitude    ' , session.fix.latitude
				print 'longitude   ' , session.fix.longitude
				print 'time utc    ' , session.utc, session.fix.time
				print 'altitude    ' , session.fix.altitude
				print '----------------------------------------'
				TCP_IP = '10.9.8.32'
				TCP_PORT = 3040
				BUFFER_SIZE = 1024
				MESSAGE = " \
				/* Java Script */\
				var sk6DocProp_Latitude = 0;\
				var sk6DocProp_Longitude = 1;\
				sky6StarChart.SetDocumentProperty(sk6DocProp_Latitude, " + str(session.fix.latitude) + ");\
				sky6StarChart.SetDocumentProperty(sk6DocProp_Longitude," + str(session.fix.longitude) + ");\
				"
				s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
				s.connect((TCP_IP, TCP_PORT))
				s.send(MESSAGE)
				data = s.recv(BUFFER_SIZE)
				s.close()
				notFound = False
				print "   " + data
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

