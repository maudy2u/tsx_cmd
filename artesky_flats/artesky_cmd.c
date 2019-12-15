// https://www.techbeamers.com/makefile-tutorial-create-client-server-program/
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
//#include "sock.h"
#include "artesky_flats.h"

void error(const char * msg) {
    perror(msg);
    exit(0);
}

int main() {
    struct sockaddr_in serv_addr;
    struct hostent *server;
    char *hostName = "localhost";
    char buffer[256];
    portno = 5570;

    // socket function which return the file descriptor which we will further bind or connect to address of the host machine or server .
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
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
    printf("Please enter the message: ");
    bzero(buffer, 256);

    // fgets() is used for the getting the message from the user or client .
    fgets(buffer, 255, stdin);

    //read or write function is used for the writing or reading the message in the socket stream.
    rc = write(sockfd, buffer, strlen(buffer));
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
