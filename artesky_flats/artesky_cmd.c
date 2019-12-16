// https://www.techbeamers.com/makefile-tutorial-create-client-server-program/
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <getopt.h>

#include <iostream>
#include <cctype>
#include <cstdio>
#include <vector>
#include <string>
#include <numeric>
#include <algorithm>

#include "./artesky_flats.h"

using namespace std;
//using namespace artesky;


void error(const char * msg) {
    perror(msg);
    exit(0);
}

// http://www.cplusplus.com/articles/DEN36Up4/
static void show_usage(std::string name)
{
    std::cerr << "Usage: " << name << " -h IP_ADDRESS -p DEVICE <command(s)>"<<endl
              << "Commands:"<<endl
              << "\t-h,--host IP\tIP address for the Artesky flat box server, e.g. 127.0.0.1"<<endl
              << "\t-d,--device PORT\tPort Artesky flat box is connected, e.g. /dev/ttyACM0"<<endl
              << "\t-b,--set LEVEL\tSet the brightness level"<<endl
              << "\t-o,--on\t\tTurn ON the panel light"<<endl
              << "\t-O,--off\t\tTurn OFF the panel light"<<endl
              << "\t--level\t\tGet the brightness level"<<endl
              << "\t--status\tGet the panel status"<<endl
              << "\t--version\tGet panel API version"<<endl
              << "\t--getPort\tget Port Panel is using"<<endl
              << "\t-x,--disconnect\tTurn off and end server"<<endl
              << "\t--help\tShow this help message"<<endl
              << std::endl;
}

int send_cmd( std::string host, std::vector<std::string> cmd ) {
  struct sockaddr_in serv_addr;
  struct hostent *server;
  const char *hostName = host.c_str();
  char buffer[256];
  portno = 5570;

  // socket function which return the file descriptor which we will further bind or connect to address of the host machine or server .
  int sockfd = socket(AF_INET, SOCK_STREAM, 0);
  if (sockfd < 0)
      error("ERROR opening socket");

  // here we search the host machine by their name (i.e called hostName).
  // on linux we find out host name by command – hostname
  // on window we find out the host name by command – ipconfig/all

  server = gethostbyname(hostName);
  if (server == NULL) {
      fprintf(stderr, "ERROR, no such host\n");
      exit(0);
  }
  bzero((char *) &serv_addr, sizeof(serv_addr));
  serv_addr.sin_family = AF_INET;
  bcopy((char *) server->h_addr,
      (char *) &serv_addr.sin_addr.s_addr,
      server->h_length);
  serv_addr.sin_port = htons(portno);

  // here we connect to thefile descriptor  with socket address
  if (connect(sockfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr)) < 0)
      error("ERROR connecting");

  cout<<"Processing \'"<<cmd.size()<<"\' commands:"<<endl;
  vector<string>::iterator it;  // declare an iterator to a vector of strings
  int i=1;
  for(it = cmd.begin(); it != cmd.end(); it++,i++) {
       cout<<i<<". \'"<<*it<<"\' "<<endl;
   }

  //read or write function is used for the writing or reading the message in the socket stream.
  std::string msg;
  std::vector<string>::iterator it_s;  // declare an iterator to a vector of strings
  for(it_s = cmd.begin(); it_s != cmd.end(); it_s++) {
       msg+=*it_s;
       msg+=" ";
   }
   // need to remove last
   if(msg.length()>0)
    msg.pop_back();

//  msg = accumulate(begin(cmd), end(cmd), msg);
  cout<<"Sending commands: "<<msg<<endl;

  rc = write(sockfd, msg.c_str(), msg.length());
  if (rc < 0)
      error("ERROR writing to socket");
  bzero(buffer, 256);
  rc = read(sockfd, buffer, 255);
  if (rc < 0)
      error("ERROR reading from socket");
  printf("%s\n", buffer);

  close(sockfd);
  return 0;

}

// https://www.geeksforgeeks.org/command-line-arguments-in-c-cpp/
int main( int argc, char** argv ) {

  if (argc < 2) { // filename = 1
      show_usage(argv[0]);
      return 1;
  }
  struct sockaddr_in serv_addr;
  struct hostent *server;
  char buffer[256];
  portno = 5570;

  // Parameters to control
  std::string hostName = "localhost";
  std::string device = "ttyACM0";
  std::string level = "50";
  std::vector<std::string> commands;

 while (1) {
    int c;
    int digit_optind = 0;
    // NOTE: this is needed to skip the first when processing the command line
    int this_option_optind = optind ? optind : 1;
    int option_index = 0;
    c = getopt_long(argc, argv, _short_options,
             _long_options, &option_index);
    if (c == -1)
        break;

    cout<<"Processing \'"<<c<<"\' = "<<_long_options[option_index].name<<endl;


    switch (c) {
    case 'h':
        printf("Foundoption h  with value '%s'\n", optarg);
        hostName=optarg;
        break;

    case 'd':
        printf("option p  with value '%s'\n", optarg);
        device=optarg;
        commands.push_back("--device");
        commands.push_back(device);
        break;

    case 'c':
        printf("option connect with value '%s'\n", optarg);
        commands.push_back("--connect");
        break;

    case 'l':
        printf("option l with value '%s'\n", optarg);
        level=optarg;
        commands.push_back("--level");
        commands.push_back(level);
        break;

    case 'L':
         printf("option l with value '%s'\n", optarg);
         commands.push_back("--getLevel");
         break;

     case 'D':
          printf("option l with value '%s'\n", optarg);
          commands.push_back("--getDevice");
          break;

    case 'v':
         printf("option version\n");
         commands.push_back("--version");
         break;

   case 'O':
        printf("option version\n");
        commands.push_back("--on");
        break;

  case 'o':
       printf("option version\n");
       commands.push_back("--off");
       break;

   case 's':
        printf("option version\n");
        commands.push_back("--status");
        break;

  case 'x':
       printf("option version\n");
       commands.push_back("--exit");
       break;

     case '?':
          show_usage(argv[0]);
          break;

     default:
          printf("?? getopt returned character code 0%o ??\n", c);
      }
  }
  cout<<"optind="<<optind<<endl;
  if (optind < argc) {
      printf("non-option ARGV-elements: ");
      while (optind < argc)
          printf("%s ", argv[optind++]);
      printf("\n");
  }

  cout<<hostName<<endl;
  cout<<device<<endl;
  cout<<commands.size()<<endl;
  int rc = send_cmd(hostName, commands);

 exit(EXIT_SUCCESS);
}
