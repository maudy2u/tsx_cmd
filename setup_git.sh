git config --global user.email "send2mesvp@mac.com"
git config --global user.name "Stephen"

git clone ssh://stephen@10.9.8.10/git/tsx_cmd

cd tsx_cmd

git branch --set-upstream-to=origin/develop

git pull ssh://stephen@10.9.8.10/git/tsx_cmd develop

git pull

