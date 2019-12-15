// /run/user/1000/gvfs/sftp:host=mountain-lion.local/Users/stephen/Documents/code/tsx_cmd/server
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>

//#include <sys/socket.h>
//#include <netinet/in.h>
#include <arpa/inet.h>
// #include "sock.h"
#include "./artesky_flats.h"

void error(const char * msg) {
    perror(msg);
    exit(1);
}

int main() {
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
    serv_addr.sin_addr.s_addr = inet_addr("127.0.0.1");
    serv_addr.sin_port = htons(portno);
    if (bind(sockfd, (struct sockaddr * ) &serv_addr,
            sizeof(serv_addr)) < 0)
        error("ERROR on binding");
	printf("Server started: %s and port %d...\n", inet_ntoa(serv_addr.sin_addr), serv_addr.sin_port);
  listen(sockfd, 5);
  clilen = sizeof(cli_addr);

    // accept function is called whose purpose is to accept the client request and
    // return the new fileDescriptor or and
    // the old file descriptor is for another (i.esockfd) client connections.

  while(1) {
    newsockfd = accept(sockfd,
        (struct sockaddr *) &cli_addr, &clilen);
    if (newsockfd < 0)
        error("ERROR on accept");
    else {
      bzero(buffer, 256);
      n = read(newsockfd, buffer, 255);
      if (n < 0) error("ERROR reading from socket");
      printf("Received message: %s\n", buffer);
      char* success = "successful";
      n = write(newsockfd, success, 30);
      if (n < 0) error("ERROR writing to socket");
    }
    close(newsockfd);
  }
  close(sockfd);
  return 0;
}
