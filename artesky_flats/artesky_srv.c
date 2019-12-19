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
#include <cstdio>
#include <vector>
#include <string>
#include <numeric>
#include <sstream>      // std::stringstream
#include <algorithm>
#include <getopt.h>

#include <boost/algorithm/string.hpp>
#include <boost/algorithm/string/classification.hpp> // Include boost::for is_any_of
#include <boost/algorithm/string/split.hpp> // Include for boost::split
#include <boost/algorithm/string/predicate.hpp>

#include "libartesky.h"

using namespace std;
using namespace boost;
using namespace artesky;

#include "./artesky_flats.h"


void error(const char * msg) {
	perror(msg);
	exit(1);
}

char* convert(const std::string & s)
{
	char *pc = new char[s.size()+1];
	std::strcpy(pc, s.c_str());
//	std::strcat(pc, "\'");
	return pc;
}

//http://www.cplusplus.com/reference/string/string/find_last_not_of/
std::string removeNewlineEscape(const std::string& line)
{
	std::string str = line;
	std::size_t found = str.find_last_not_of(_whitespaces);
	if (found!=std::string::npos)
		str.erase(found+1);
	else
		str.clear();            // str is all whitespace
#ifdef __DEBUG
	std::cout << '[' << str << "]\n";
#endif
	return str;
} // checkNewlineEscape

// https://stackoverflow.com/questions/21272997/c-read-from-socket-into-stdstring
// https://stackoverflow.com/questions/21272997/c-read-from-socket-into-stdstring
std::string Communication_recv(int sock, int bytes) {
	std::string output(bytes, 0);
	if (read(sock, &output[0], bytes-1)<0) {
		std::cerr << "Failed to read data from socket.\n";
	}
	return output;
}

// https://stackoverflow.com/questions/6911700/how-can-you-strip-non-ascii-characters-from-a-string-in-c
struct InvalidChar
{
    bool operator()(char c) const {
        return !isprint(static_cast<unsigned char>(c));
    }
};

// http://www.cplusplus.com/articles/DEN36Up4/
static void show_usage(std::string name)
{
	std::cerr << "Usage: " << name<<endl
	<< "\t--ip IP_ADDRESS"<<endl
	<< std::endl;
}

// *****************************************************
int main( int argc, char** argv ) {
	
	if (argc < 3) { // filename = 1
		show_usage(argv[0]);
		return 1;
	}
	
	// =======================
	// Prep for artesky_srv
	int c, newsockfd;
	
	std::string hostName = "127.0.0.1";
	
	int digit_optind = 0;
	int this_option_optind = optind ? optind : 1;
	int option_index = 0;
	static struct option long_options[] = {
		{"ip",    required_argument,  0,  'h' },
		{0,       0,                  0,  0 }
	};
	
	c = getopt_long(argc, argv, "h:?",
					long_options, &option_index);
	if (c == -1) {
		
		
		return 1;
	}
	
	// Process the command line
	switch (c) {
		case 0:
			printf("option %s", _long_options[option_index].name);
			if (optarg)
				printf(" with arg %s", optarg);
			printf("\n");
			break;
			
		case '0':
		case '1':
		case '2':
			if (digit_optind != 0 && digit_optind != this_option_optind)
				printf("digits occur in two different argv-elements.\n");
			digit_optind = this_option_optind;
			printf("option %c\n", c);
			break;
		case 'h':
			printf("Setting host: '%s'\n", optarg);
			hostName=optarg;
			break;
		case '?':
			show_usage(argv[0]);
			break;

		default:
			// keep hostName="127.0.0.1";
			return 1;
	}
	if (optind < argc) {
		printf("non-option ARGV-elements: ");
		while (optind < argc)
			printf("%s ", argv[optind++]);
		printf("\n");
		return 1;
	}
	
	// *******************************
	// Artesky specifics
	ASL_ERROR ret = ASL_NO_ERROR;
	Flat flat;
	bool _status = false;
	bool _isConnected = false;
	uint32_t _level = 0;
	
	std::string _serialPort = "ttyARTESKYFLAT";
	std::string _srv_version = "1.0";
	std::string _version = "";
	
#ifdef _WIN32
	system("CLS");
#elif __linux
	system("clear");
#endif // _WIN32
	
	cout << "***************************" << endl;
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
	if (bind(sockfd, (struct sockaddr * ) &serv_addr, sizeof(serv_addr)) < 0) {
		cout<<"ERROR on binding"<<endl;
		return 10;
	}
	cout<<"Artesky Server: " << inet_ntoa(serv_addr.sin_addr) << ", port " <<serv_addr.sin_port << endl;
	listen(sockfd, 5);
	clilen = sizeof(cli_addr);
	
	// accept function is called whose purpose is to accept the client request and
	// return
	int EXIT=0;
	while(1) {
		newsockfd = accept(sockfd,
						   (struct sockaddr *) &cli_addr, &clilen);

		std::stringstream oss; // used for out put details
		if (newsockfd < 0)
			cout<<"ERROR on accept"<<endl;
		else {
			std:string cmds = Communication_recv(newsockfd,256);
			cout<<endl<<"========RECEIVED NEW COMMANDS========"<<endl;
			
			// https://stackoverflow.com/questions/5607589/right-way-to-split-an-stdstring-into-a-vectorstring
			// put buffer into a vector(should be able to remove this and go to Vector directly)
			std::vector<std::string> str_v;
			boost::split(str_v, cmds, boost::is_any_of(_whitespaces), boost::token_compress_on);
			
/*
		// https://stackoverflow.com/questions/7048888/stdvectorstdstring-to-char-array
			// Convert the vector to use with getopt_long
			std::vector<char*> s_argv;
			std::vector<string>::iterator it_s;  // declare an iterator to a vector of strings
			for(it_s = str_v.begin(); it_s != str_v.end(); it_s++) {
				if(*it_s > "") {
//					s_argv.push_back(convert(*it_s));
					s_argv.push_back(const_cast<char*>((*it_s).c_str()));
					cout<<"\'"<<*it_s<<"\'"<<endl;
				}
			}
*/
//			stripUnicode(str_v[0]);
//			stripUnicode(str_v[1]);
//			if(str_v[0] == str_v[1] ) {
//				cout<<"matched"<<endl;
//			}
//			else {
//				cout<<"NOT matched\n"
//					<<"0. \'"<<str_v[0]<<"\'"<<str_v[0].size()<<"\n"
//					<<"1. \'"<<str_v[1]<<"\'"<<str_v[1].size()<<endl;
//			}
			oss<<"Processed:"<<endl;
			cout<<oss.str();
			// std::vector<string>::iterator it_c;  // declare an iterator to a vector of strings
			for(int i=0; i<str_v.size(); i++) {
				std::stringstream ocmd;
				std::string cmd = str_v[i];
				cmd.erase(remove_if(cmd.begin(), cmd.end(), [](char c) { return !isprint(c); } ), cmd.end());
				cout<<i+1<<". "<<cmd<<", ";
				oss<<"\t"<<i+1<<". "<<cmd<<":\t";
				if( boost::iequals(cmd," ") ){
				}
				else if( boost::iequals(cmd,"") ){
				}
				else if( boost::iequals(cmd,"--on") ){
					ret = flat.turnOn();
					if (ret == ASL_NO_ERROR)
						oss << "Lamp turned on" << endl;
					else
						oss << "ERROR Lamp On" << endl;
				}
				else if( boost::iequals(cmd,"--isConnected") ){
					ret = flat.isFlatConnected(_isConnected);
					if (ret == ASL_NO_ERROR)
					{
						if (_isConnected)
							oss << "Flat is connected" << endl;
						else
							oss << "Flat is disconnected" << endl;
					}
					else
						oss << "ERROR isConnected failed." << endl;
				}
				else if( boost::iequals(cmd,"--device") ) {
					oss<<"Current --device: "<<cmd<<endl;
					i++;
					cmd = str_v[i];
					boost::algorithm::trim(cmd);
					oss<<"Setting --device "<<cmd<<endl;
					_serialPort = cmd;
				}
				else if( boost::iequals(cmd, "--connect") ) {
					ret = flat.connect(_serialPort.c_str());
					if (ret == ASL_NO_ERROR)
						oss << "Connected" << endl;
					else
						oss << "ERROR Connecting Panel" << endl;
				}
				else if( cmd == "--disconnect" ){
					ret = flat.turnOff();
					if (ret == ASL_NO_ERROR)
						oss << "Lamp turned off, ";
					else
						oss << "ERROR Lamp off, ";
					ret = flat.disconnect();
					if (ret == ASL_NO_ERROR)
						oss << "Disconnected" << endl;
					else
						oss << "ERROR Disconnecting panel" << endl;
				}
				else if( cmd == "--level" ){
					_level = 0;
					i++;
					cmd = str_v[i];
					boost::algorithm::trim(cmd);
					// convert cmd to integer
					_level = std::stoi( cmd );
					if( _level < 0 ) _level = 0;
					if( _level > 255 ) _level = 255;
					oss << "Setting Lamp brightness level to: " << _level << endl;
					ret = flat.setBrightness(_level);
					if (ret == ASL_NO_ERROR)
						oss << "Lamp brightness level set: " << _level << endl;
					else
						oss<< "ERROR Setting light panel" << endl;
				}
				else if( cmd == "--getLevel" ){
					ret = flat.getBrightness(_level);
					if (ret == ASL_NO_ERROR)
						oss << "Lamp brightness level is: " << _level << endl;
					else
						oss << "LIBRARY ERROR" << endl;
				}
				else if( boost::iequals(cmd,"--getDevice") ){
					ret = flat.getSerialPort(_serialPort);
					if (ret == ASL_NO_ERROR)
						oss << "Flat connection port: " << _serialPort  << endl;
					else
						oss << "LIBRARY ERROR" << endl;
				}
				else if( boost::iequals(cmd,"--status") ){
					ret = flat.getStatus(_status);
					if (ret == ASL_NO_ERROR)
					{
						if (_status)
							oss << "Status: Lamp is on" << endl;
						else
							oss << "Status: Lamp is off" << endl;
					}
					else
						oss << "LIBRARY ERROR" << endl;
				}
				else if( cmd == "--off" ){
					ret = flat.turnOff();
					if (ret == ASL_NO_ERROR)
						oss << "Lamp turned off" << endl;
					else
						oss << "LIBRARY ERROR" << endl;
				}
				else if( cmd == "--version" ){
					ret = flat.getAPIversion(_version);
					if (ret == ASL_NO_ERROR)
						oss << "API version: " << _version << endl;
					else
						oss << "LIBRARY ERROR" << endl;
				}
				else if( cmd == "--exit" ){
					ret = flat.turnOff();
					if (ret == ASL_NO_ERROR)
						oss << "Lamp turned off" << endl;
					else
						cout << "LIBRARY ERROR" << endl;
					ret = flat.disconnect();
					if (ret == ASL_NO_ERROR)
						oss << "Disconnected" << endl;
					else
						oss << "LIBRARY ERROR" << endl;
					EXIT=1;
					break;
				}
				else {
					cout<<"OUCH! Unknown command: \'"<<cmd<<"\'"<<endl;
				}
			}
		} // end while to process commands
		// 	Can need to put this to the end
		cout<<endl;
		std::string success = oss.str();
		n = write(newsockfd, success.data(), success.size());
		if (n < 0)
			error("ERROR writing to socket");
		
		close(newsockfd);
		if( EXIT ) {
			break;
		}
	} // accept new connection
	close(sockfd);
	cout<<"Server STOPPED."<<endl;
	return 0;
}
