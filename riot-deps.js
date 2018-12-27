var fs = require('fs');
var path = require('path');
var PATTERN = /<\/([a-zA-Z0-9]+-[a-zA-Z0-9\-]+)\s*>/g;
var readdir = require('recursive-readdir');



class RiotDependencyGraph {
  constructor(tagdir) {
    this.tagdir = tagdir;
  }

  build() {
    var self = this;
    return this._listTags(this.tagdir).then(tags => {
      let tree = new Map();
      console.log('discovered %d tags', tags.length);

      tags.forEach(item => {
        self._parseDependencies(item);
        tree.set(item.tag, item);
      });

      self._print(tree);
    })
  }

  _listTags(dirname) {
    return readdir(dirname).then(files => {
      return files.filter(filename => {
        return filename.toLowerCase().endsWith('.tag.html')
      }).map(filename => {
        return {
          filename: filename,
          tag: path.basename(filename).split('.')[0]
        };
      });
    });
  }

  _parseDependencies(item) {
    var body = fs.readFileSync(item.filename, {encoding: 'utf8'});
    var pattern = new RegExp(PATTERN);
    var match = pattern.exec(body);
    var found = [];

    console.log('_parseDependencies( %s )', item.filename);

    while(match != null) {
      let dep = match[1].toLowerCase();
      if(dep != item.tag) {
        found.push(match[1]);
      }

      match = pattern.exec(body);
    }

    item.deps = found.filter((value, index, self) => self.indexOf(value) == index);
    console.log('>> %d', item.deps.length);
  }

  _print(tree) {
    var self = this;
    tree.forEach(item => {
      self._printTag(item, tree, '+ ');
    });
  }

  _printTag(item, tree, prefix) {
    var self = this;
    console.log('%s%s', prefix, item.tag);
    prefix = ' '.repeat(prefix.length) + '|- ';
    item.deps.forEach(dep => {
      let subitem = tree.get(dep);
      if(!subitem) {
        console.log('%s%s !!!', prefix, dep);
      } else {
        self._printTag(subitem, tree, prefix);
      }
    });
  }

  update(filename) {
    let item = {
      filename: filename,
      tag: path.basename(filename).split('.')[0]
    };
    this._parseDependencies(item);
    this.tree.set(item.tag, item);
  }

  _generateView(item) {
  }
}

var graph = new RiotDependencyGraph('./public/tags');
graph.build().then(() => {
  console.log('done');
})

