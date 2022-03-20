#!/bin/bash
export NVM_DIR=$HOME/.nvm;
. $NVM_DIR/nvm.sh;

cd $1
nvm use --lts > /dev/null
npx xslt3 -xsl:xslt3-input.xsl -export:xslt3-input.sef.json -nogo
# !!! to synch only last command emit output
echo "sef created"