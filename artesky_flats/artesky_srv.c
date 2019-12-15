// /run/user/1000/gvfs/sftp:host=mountain-lion.local/Users/stephen/Documents/code/tsx_cmd/server
// https://www.techbeamers.com/makefile-tutorial-create-client-server-program/
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#include <iostream>
#include <cctype>
#include <getopt.h>
#include "./artesky_flats.h"

using namespace std;
//using namespace artesky;

void error(const char * msg) {
    perror(msg);
    exit(1);
}

bool compareChar(char & c1, char & c2)
{
	if (c1 == c2)
		return true;
	else if (std::toupper(c1) == std::toupper(c2))
		return true;
	return false;
}
/*
 * Case Insensitive String Comparision
 */
 bool caseInSensStringCompare(std::string & str1, char* c2)
 {
   std:string str2 = c2;
 	return ( (str1.size() == str2.size() ) &&
 			 std::equal(str1.begin(), str1.end(), str2.begin(), &compareChar) );
 }

//http://www.cplusplus.com/reference/string/string/find_last_not_of/
std::string removeNewlineEscape(const std::string& line)
{
  std::string str = line;
  std::string whitespaces (" \t\f\v\n\r");
  std::size_t found = str.find_last_not_of(whitespaces);
  if (found!=std::string::npos)
    str.erase(found+1);
  else
    str.clear();            // str is all whitespace
#ifdef __DEBUG
  std::cout << '[' << str << "]\n";
#endif
  return str;
} // checkNewlineEscape

// *****************************************************
int main( int argc, char** argv ) {
    // Prep for artesky_cmd
    int c;
    std::string hostName = "localhost";

    int digit_optind = 0;
    int this_option_optind = optind ? optind : 1;
    int option_index = 0;
    static struct option long_options[] = {
        {"ip",    required_argument,  0,  'h' },
        {0,       0,                  0,  0 }
    };

   c = getopt_long(argc, argv, "h:",
             long_options, &option_index);
   if (c == -1)
      return 1;

   switch (c) {
     case 'h':
        printf("Foundoption h  with value '%s'\n", optarg);
        hostName=optarg;
        break;
    default:
      return 1;
    }
    if (optind < argc) {
         printf("non-option ARGV-elements: ");
         while (optind < argc)
             printf("%s ", argv[optind++]);
         printf("\n");
         return 1;
     }

//    ASL_ERROR ret = ASL_NO_ERROR;
//  	Flat flat;
  	int choice = 0;
  	uint32_t _level = 0;
  	bool _status = false;
  	bool _isConnected = false;
    std::string _srv_version = "1.0";
  	std::string _version = "";
  	std::string _serialPort = "";
  #ifdef _WIN32
  	_serialPort = "COM4";
  #elif __linux
  	_serialPort = "ttyACM0";
  #endif
  #ifdef _WIN32
  system("CLS");
  #elif __linux
  system("clear");
  #endif // _WIN32
  cout << "***************************" << endl;
/*
  cout << "1)  connect" << endl;
  cout << "2)  disconnect" << endl;
  cout << "3)  turnOn" << endl;
  cout << "4)  turnOff" << endl;
  cout << "5)  setBrightness" << endl;
  cout << "6)  getBrightness" << endl;
  cout << "7)  getStatus" << endl;
  cout << "8)  getAPIversion" << endl;
  cout << "9)  isFlatConnected" << endl;
  cout << "10) getSerialPort" << endl;
  cout << "11) EXIT" << endl;
*/
    // Setup the TCP socket
    portno = 5570;
    socklen_t clilen;
    char buffer[256];
    struct sockaddr_in serv_addr, cli_addr;
    int n;
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0)
        error("ERROR opening socket");
    bzero((char *) &serv_addr, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = inet_addr(hostName.c_str());
    serv_addr.sin_port = htons(portno);
    if (bind(sockfd, (struct sockaddr * ) &serv_addr, sizeof(serv_addr)) < 0)
        cout<<"ERROR on binding";
    cout<<"Server started at " << inet_ntoa(serv_addr.sin_addr) << " and port " <<serv_addr.sin_port << endl;
  listen(sockfd, 5);
  clilen = sizeof(cli_addr);

    // accept function is called whose purpose is to accept the client request and
    // return the new fileDescriptor or and
    // the old file descriptor is for another (i.esockfd) client connections.

  while(1) {
    newsockfd = accept(sockfd,
        (struct sockaddr *) &cli_addr, &clilen);
    if (newsockfd < 0)
        cout<<"ERROR on accept"<<endl;
    else {
      bzero(buffer, 256);
      n = read(newsockfd, buffer, 255);
      if (n < 0)
        error("ERROR reading from socket");

      std::string success = "successful";
      n = write(newsockfd, &success, 30);
      if (n < 0)
        error("ERROR writing to socket");

      std::string cmd = removeNewlineEscape(buffer);
#ifdef __DEBUG
      cout<<"Processing command: "<<cmd<<endl;
#endif
      if (caseInSensStringCompare(cmd, (char *)"1"))
      {
//      ret = flat.connect(_serialPort.c_str());
//        if (ret == ASL_NO_ERROR)
//          cout << "Connected" << endl;
//        else
//          cout << "LIBRARY ERROR" << endl;
          cout << "Matched COMMAND 1" << endl;

      }
/*      else if (choice == 2)
      {
        ret = flat.disconnect();
        if (ret == ASL_NO_ERROR)
          cout << "Disconnected" << endl;
        else
          cout << "LIBRARY ERROR" << endl;
      }
      else if (choice == 3)
      {
        ret = flat.turnOn();
        if (ret == ASL_NO_ERROR)
          cout << "Lamp turned on" << endl;
        else
          cout << "LIBRARY ERROR" << endl;
      }
      else if (choice == 4)
      {
        ret = flat.turnOff();
        if (ret == ASL_NO_ERROR)
          cout << "Lamp turned off" << endl;
        else
          cout << "LIBRARY ERROR" << endl;
      }
      else if (choice == 5)
      {
        _level = 0;
        cout << "Inset brightness level [0-255]: ";
        cin >> _level;
        ret = flat.setBrightness(_level);
        if (ret == ASL_NO_ERROR)
          cout << "Lamp brightness level set: " << _level << endl;
        else
          cout << "LIBRARY ERROR" << endl;
      }
      else if (choice == 6)
      {
        ret = flat.getBrightness(_level);
        if (ret == ASL_NO_ERROR)
          cout << "Lamp brightness level is: " << _level << endl;
        else
          cout << "LIBRARY ERROR" << endl;
      }
      else if (choice == 7)
      {
        ret = flat.getStatus(_status);
        if (ret == ASL_NO_ERROR)
        {
          if (_status)
            cout << "Status: Lamp is on" << endl;
          else
            cout << "Status: Lamp is off" << endl;
        }
        else
          cout << "LIBRARY ERROR" << endl;
      }
      else if (choice == 8)
      {
        ret = flat.getAPIversion(_version);
        if (ret == ASL_NO_ERROR)
          cout << "API version: " << _version << endl;
        else
          cout << "LIBRARY ERROR" << endl;
      }
      else if (choice == 9)
      {
        ret = flat.isFlatConnected(_isConnected);
        if (ret == ASL_NO_ERROR)
        {
          if (_isConnected)
            cout << "Flat is connected" << endl;
          else
            cout << "Flat is disconnected" << endl;
        }
        else
          cout << "LIBRARY ERROR" << endl;
      }
*/
      else if (caseInSensStringCompare(cmd, (char *)"10"))

      {
//        ret = flat.getSerialPort(_serialPort);
//        if (ret == ASL_NO_ERROR)
//          cout << "Flat connection port: " << _serialPort;
//        else
          cout << "Matched COMMAND 10" << endl;
      }
      else if (caseInSensStringCompare(cmd, (char *)"exit"))

      {
          break;
      }
      else {
        cout<<"Ingored command: "<<cmd<<endl;
        continue;
      }
    }
    close(newsockfd);
  }
  close(sockfd);
  return 0;
}
