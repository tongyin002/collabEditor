import { find, includes } from "lodash";
import { updateVersionWith } from "./util";

class Vector {
  constructor(id) {
    this.id = id;
    this.versions = [];
    this.localVersion = { id, counter: 0, notSeen: [] };
    this.versions.push(this.localVersion);
  }

  updateCounter() {
    this.localVersion.counter++;
  }

  redundantWork(version) {
    let localVersion = find(this.versions, ver => {
      return ver.id === version.id;
    });

    if (!!!localVersion) return false;

    return (
      version.counter <= localVersion.counter &&
      !includes(localVersion.notSeen, version.counter)
    );
  }

  updateVersion(version) {
    let localVersion = find(this.versions, ver => {
      return ver.id === version.id;
    });

    if (localVersion) {
      updateVersionWith(localVersion, version);
    } else {
      localVersion = { id: version.id, counter: 0, notSeen: [] };
      updateVersionWith(localVersion, version);
      this.versions.push(localVersion);
    }
  }
}

export default Vector;
