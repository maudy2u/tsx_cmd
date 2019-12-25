# https://www.techbeamers.com/makefile-tutorial-create-client-server-program/
#make file overview :--
#you can add a little description here.

#variable declaration :-
# this is the variable which is used in the target.
cc=gcc
cpp=g++
MAKE=make
RM =rm

#targets .
all: client server
	$(cpp) -o artesky_cmd artesky_cmd.c
	$(cpp) -o artesky_srv artesky_srv.c
	#gnome-terminal -t server --working-directory=/home/parallels/src/tmp -e "./server"
	sleep 10s
	$(MAKE) client_target


#another target for client
server:
	#$(cpp) -g -o artesky_srv artesky_srv.c
	$(cpp)  -I./artesky-projects-devel/libartesky_SDK/1.0.0/include ./artesky_srv.c /lib/libartesky_arm64.so -o artesky_srv


client:
	$(cpp) -g -o artesky_cmd artesky_cmd.c

#another target for client
client_target:
	./artesky_cmd


clean:
	$(RM) artesky_srv
	$(RM) artesky_cmd
