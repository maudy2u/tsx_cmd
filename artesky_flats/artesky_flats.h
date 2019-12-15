// Use this for common information
int sockfd, newsockfd, portno, rc;
static struct option _long_options[] = {
    {"host",    required_argument,  0,  'h' },
    {"device",    required_argument,  0,  'd' },
    {"connect",  required_argument, 0,  'c' },
    {"level",   required_argument,  0,  'l' },
    {"on",      no_argument,        0,  'O' },
    {"off",     no_argument,        0,  'o'},
    {"status",  no_argument,        0,  's' },
    {"version",  no_argument,       0,  'v' },
    {"getDevice",  no_argument,       0,  'D' },
    {"getLevel",  no_argument,      0,  'L' },
    {"disconnect",  no_argument,    0,  'x' },
    {0,         0,                   0,  0 }
};
const char* _short_options = "h:d:c:l:OosvDLx";
static std::string _whitespaces (" \t\f\v\n\r");
