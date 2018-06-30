#!/usr/bin/env bash
function usage {
	echo "$(basename "$0") <src> <yield>" ;}
if [ "$#" -ne 2 ]; then
	echo "$(usage)"
	exit 1 ;fi


function use_deps {
	cd "$(dirname "$0")" ;}
function use_coreutils {
	([[ `uname` == 'Darwin' ]]
	) && { [ -d "/usr/local/opt/coreutils/libexec/gnubin" ] || {
		echo "coreutils not found"
		return 1 
	} && PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH" ;} }
function use_node {
	use_node_bare || {
		return 1 
	} && ([ -f "$(dirname $(npm root))/package.json" ]
	) && { [ -d "$(npm root)" ] || {
		#TODO: does not cover case of empty dependencies
		echo "node modules not installed"
		return 1 ;} } }
function use_node_bare {
	. ~/.nvm/nvm.sh --no-use
	nvm use 10 > /dev/null
	[[ "$(node --version)" == "v10"* ]] || {
		echo "couldn't change to node v10"
		return 1 ;} }
function use_file {
	[ -d "$1" ] || {
		echo "$1 doesn't exist"
		return 1 ;} }

function find_project_root {
	git rev-parse --show-toplevel; } 

src="$1"
yield="$2"

root="$(find_project_root)"
