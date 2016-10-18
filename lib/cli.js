var path = require('path');
var fs = require('fs');
var cli = require('clap');
var csstree = require('css-tree');

function readFromStream(stream, process) {
    var buffer = [];

    // FIXME: don't chain until node.js 0.10 drop, since setEncoding isn't chainable in 0.10
    stream.setEncoding('utf8');
    stream
        .on('data', function(chunk) {
            buffer.push(chunk);
        })
        .on('end', function() {
            process(buffer.join(''));
        });
}

function printCompact(ast) {
    console.log(JSON.stringify(ast));
}

function printPretty(ast) {
    console.log(JSON.stringify(ast, null, 4));
}

var command = cli.create('csstree', '[filename]')
    .version(require('../package.json').version)
    .option('-c, --compact', 'Compact output')
    .action(function(args) {
        var options = this.values;
        var inputFile = args[0];
        var inputStream;
        var print = options.compact ? printCompact : printPretty;

        if (process.stdin.isTTY && !inputFile) {
            this.showHelp();
            return;
        }

        if (!inputFile) {
            inputFile = '<stdin>';
            inputStream = process.stdin;
        } else {
            inputFile = path.resolve(process.cwd(), inputFile);
            inputStream = fs.createReadStream(inputFile);
        }

        readFromStream(inputStream, function(source) {
            try {
                print(csstree.parse(source));
            } catch (e) {
                console.error(e.formattedMessage || e);
            }
        });
    });

module.exports = {
    run: command.run.bind(command),
    isCliError: function(err) {
        return err instanceof cli.Error;
    }
};
