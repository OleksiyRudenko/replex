#!/usr/bin/env bash
# git repo base dir
project_root=$(git rev-parse --show-toplevel)
source <(grep = "$project_root/golt.ini" | sed 's/ *= */=/g')
database_repo_root="$project_root/$database"

Help()
{
  # Display Help
  echo "Syntax: golt[.sh] command [parameters]"
  echo "Uses current git repo golt.ini."
  echo "Commands:"
  echo "  register-golt-alias - register golt as an alias."
  echo "    Use golt as a command from any context instead of calling the script './golt.sh'."
  echo "  clone - clone dolt repo from dolthub (see golt.ini)"
  echo "  status - git and dolt status"
  echo "  remote - list git and dolt remotes"
  echo "  checkout - checkout branch with both git and dolt"
  echo "  create-branch - create branch following business workflow on both git and dolt"
  echo "  commit - "
  echo "  push - "
  echo "  merge - "
  echo "  rebase - "
  echo "  pull - "
}

current_dir=$(pwd)
cd $project_root

case "$1" in
  "register-golt-alias")
    echo "alias golt='bash $project_root/golt.sh'" >> ~/.bashrc
    ;;
  "clone")
    echo "Cloning dolt repo from $dolthub_user/$database"
    golt remote
    echo "=== Dolt >>>"
    dolt clone "$dolthub_user/$database"
    golt remote
    golt status
    ;;
  "status")
    echo "=== Git status >>>"
    git status
    echo "=== Dolt status >>>"
    (cd $database && dolt status)
    ;;
  "remote")
    echo "=== Git remote -v >>>"
    git remote -v
    echo "=== Dolt remote >>>"
    (cd $database && dolt remote -v)
    ;;
  "create-branch")
    echo "=== Git checkout -b>>>"
    git checkout -b "data-$1-$2-$3"
    echo "=== Dolt branch & checkout >>>"
    (cd $database_repo_root && dolt branch "data-$1-$2-$3")
    (cd $database_repo_root && dolt checkout "data-$1-$2-$3")
    ;;
  *)
    Help
    exit 1
    ;;
esac

cd $current_dir

# References:
# - https://serverfault.com/questions/345665/how-to-parse-and-convert-ini-file-into-bash-array-variables
# - https://opensource.com/article/21/8/option-parsing-bash
# - https://www.redhat.com/en/blog/arguments-options-bash-scripts
