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
  echo "  create-branch name - create branch on both git and dolt"
  echo "  create-program-branch program user modifier -"
  echo "    create branch following business workflow on both git and dolt"
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
  "checkout")
    echo "Dolt errors. See also https://github.com/dolthub/dolt/issues/7548"
    if [ "$2" = "" ]; then
      echo "=== List branches"
      echo "=== Git branch >>>"
      git branch
      echo "=== Dolt branch --list >>>"
      (cd $database_repo_root && dolt branch --list)
    else
      echo "=== Git checkout >>>"
      git checkout "$2"
      echo "=== Dolt checkout >>>"
      dolt sql -q "CALL DOLT_CHECKOUT('$2')"
    fi
    ;;
  "create-branch")
    if [ "$2" = "" ]; then
      echo "=== List branches"
      echo "=== Git branch >>>"
      git branch
      echo "=== Dolt branch --list >>>"
      (cd $database_repo_root && dolt branch --list)
    else
      echo "=== Git checkout -b >>>"
      git checkout -b "$2"
      echo "=== Dolt checkout -b >>>"
      dolt sql -q "CALL DOLT_CHECKOUT('-b', '$2')"
    fi
    ;;
  "create-program-branch")
    if [ "$2" = "" ]; then
      echo "=== List data branches"
      echo "=== Git branch >>>"
      git branch --list "$program_branch_prefix-*"
      echo "=== Dolt branch --list >>>"
      (cd $database_repo_root && dolt branch --list | grep "^. $program_branch_prefix-.*")
    else
      echo "=== Git checkout -b $program_branch_prefix-$2-$3-$4 >>>"
      git checkout -b "$program_branch_prefix-$2-$3-$4"
      echo "=== Dolt checkout -b >>>"
      dolt sql -q "CALL DOLT_CHECKOUT('-b', '$program_branch_prefix-$2-$3-$4')"
    fi
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
