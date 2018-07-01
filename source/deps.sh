#!/usr/bin/env bash
function usage {
	echo "$(basename "$0") <source> <out>" ;}
if [ "$#" -ne 2 ]; then
	echo "$(usage)"
	exit 1 ;fi


function use_deps {
	cd "$(dirname "$0")" ;}
function use_coreutils {
	if [[ `uname` == 'Darwin' ]]; then
		[ -d "/usr/local/opt/coreutils/libexec/gnubin" ] || {
			echo "coreutils not found"
			return 1 
		} && PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH" ;fi }
function use_node {
	use_node_bare || {
		return 1 
	} && if [ -f "$(dirname $(npm root))/package.json" ]; then
		[ -d "$(npm root)" ] || {
			#TODO: does not cover case of empty dependencies
			echo "node modules not installed"
			return 1 ;} fi ;}
function use_node_bare {
	. ~/.nvm/nvm.sh --no-use
	nvm use 10 > /dev/null
	[[ "$(node --version)" == "v10"* ]] || {
		echo "couldn't change to node v10"
		return 1 ;} }
function use_file {
	[ -f "$1" ] || {
		echo "$1 doesn't exist"
		return 1 ;} }

function find_project_root {
	git rev-parse --show-toplevel; } 

use_coreutils || {
	exit 1 ;}

bare_source="${1%/}"
bare_out="${2%/}"

source="$(readlink -m "$bare_source")"
out="$(readlink -m "$bare_out")"

cd "$(dirname "${0}")"
root="$(find_project_root)"
