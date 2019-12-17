// Use this for common information
int sockfd, newsockfd, portno, rc;

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

static struct option _long_options[] = {
    {"host",      required_argument,  0,  'h' },
    {"device",    required_argument,  0,  'd' },
    {"connect",   no_argument, 0,  'c' },
    {"isConnect",   no_argument, 0,  'C' },
    {"disconnect",   no_argument, 0,  'x' },
    {"level",     required_argument,  0,  'l' },
    {"on",        no_argument,        0,  'O' },
    {"off",       no_argument,        0,  'o'},
    {"status",    no_argument,        0,  's' },
    {"version",   no_argument,       0,  'v' },
    {"getDevice", no_argument,       0,  'D' },
    {"getLevel",  no_argument,      0,  'L' },
    {"exit",      no_argument,    0,  'X' },
    {0,         0,                   0,  0 }
};
const char* _short_options = "h:d:cCl:OosvDLxX012";
static std::string _whitespaces (" \t\f\v\n\r\0");
