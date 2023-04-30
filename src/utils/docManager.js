import ShareDBMonaco from "sharedb-monaco";

const errorHandler = (resolve, reject) => (error) => {
  error ? reject(error) : resolve();
};

const createDoc = (doc, data) =>
  new Promise((resolve, reject) => {
    doc.create(data, "json0", {}, errorHandler(resolve, reject));
  });

const fetchDoc = (doc) =>
  new Promise((resolve, reject) => {
    doc.fetch(errorHandler(resolve, reject));
  });

const subscribeDoc = (doc) =>
  new Promise((resolve, reject) => {
    doc.subscribe(errorHandler(resolve, reject));
  });

const submitOp = (doc, op) =>
  new Promise((resolve, reject) => {
    doc.submitOp(op, {}, errorHandler(resolve, reject));
  });

const deleteDoc = (doc) =>
  new Promise((resolve, reject) => {
    doc.del({}, errorHandler(resolve, reject));
  });

export default class DocManager {
  constructor(editor, monaco, connection, projectid) {
    this.editor = editor;
    this.monaco = monaco;
    this.connection = connection;
    this.projectid = projectid;
    this.bindings = {};
    this.curBinding = null;
    this.index_file = this.connection.get(projectid, "!!!__index__");
    this.initDocs();
  }

  getDocNames = () => {
    return this.index_file.data.names;
  };

  async initDocs() {
    await subscribeDoc(this.index_file);
    if (this.index_file.type === null) {
      await createDoc(this.index_file, { names: [] });
    }
    const docnames = this.getDocNames();
    const addactions = docnames.forEach((name) => {
      this.addDocLocally(name);
    });

    const intervalInSeconds = 1;
    setInterval(() => this.syncDocList(), intervalInSeconds * 1000);
  }

  addDocLocally(filename) {
    const binding = new ShareDBMonaco({
      id: filename,
      namespace: this.projectid,
      sharePath: "content",
      monaco: this.monaco,
      connection: this.connection,
      loadingText: `Loading file ${filename} ...`,
    });
    this.bindings[filename] = binding;
  }

  async delDocLocally(filename) {
    const binding = this.bindings[filename];
    if (binding) {
      delete this.bindings[filename];
      await binding.close();
    }
  }

  async addDocGlobally(filename, content = "") {
    try {
      const doc = this.connection.get(this.projectid, filename);
      await fetchDoc(doc);
      if (doc.type !== null) {
        return false;
      }
      await createDoc(doc, { content });
      await submitOp(this.index_file, [
        {
          p: ["names", 0],
          li: filename,
        },
      ]);
      this.addDocLocally(filename);
    } catch (err) {
      return false;
    }
    return true;
  }

  async delDocGlobally(filename) {
    try {
      const doc = this.connection.get(this.projectid, filename);
      await fetchDoc(doc);
      if (doc.type === null) {
        return false;
      }
      const idx = this.index_file.data.names.findIndex(filename);
      await deleteDoc(doc);
      await submitOp(this.index_file, [
        {
          p: ["names", idx],
          ld: filename,
        },
      ]);
      await this.delDocLocally(filename);
    } catch (err) {
      return false;
    }
    return true;
  }

  async syncDocList() {
    const docnames = this.getDocNames();

    const newnames = docnames.filter((name) => this.bindings[name]);
    const addactions = newnames.forEach((name) => this.addDocLocally(name));

    const delnames = Object.keys(this.bindings).filter(
      (name) => !docnames.includes(name)
    );
    const delactions = delnames.map((name) => this.delDocLocally(name));

    await Promise.all(delactions);
  }

  async switchDoc(filename) {
    if (this.bindings[filename]) {
      if (this.curBinding) {
        await this.curBinding.remove(this.editor.getId());
      }
      this.curBinding = this.bindings[filename];
      this.curBinding.add(this.editor);
    } else {
      throw new Error("Invalid filename");
    }
  }

  setCurrentFileLangId(langid) {
    if (this.curBinding) {
      this.curBinding.setLangId(langid);
    }
  }
}
