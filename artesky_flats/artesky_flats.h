// Use this for common information
int sockfd, newsockfd, portno, rc;

static struct option _long_options[] = {
	{"host",      required_argument,  0,  'h' },
	{"device",    required_argument,  0,  'd' },
	{"connect",   no_argument, 0,  'c' },
	{"on",        no_argument,        0,  'O' },
	{"off",       no_argument,        0,  'o'},
	{"level",     required_argument,  0,  'l' },
	{"getLevel",  no_argument,      0,  'L' },
	{"getDevice", no_argument,       0,  'D' },
	{"isConnect",   no_argument, 0,  'C' },
	{"status",    no_argument,        0,  's' },
	{"version",   no_argument,       0,  'v' },
	{"disconnect",   no_argument, 0,  'x' },
	{"exit",      no_argument,    0,  'X' },
	{0,         0,                   0,  0 }
};
const char* _short_options = "h:d:cCl:OosvDLxX?012";
static std::string _whitespaces (" \t\f\v\n\r\0");
