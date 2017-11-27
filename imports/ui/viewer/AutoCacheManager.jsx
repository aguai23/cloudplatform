let __instance = (function() {
  let instance;

  return (newInstance) => {
    if(newInstance) {
      instance = newInstance;
    }
    return instance;
  }
}());

export default class AutoCacheManager {
  constructor(sliceNumber) {
    if(__instance()) {
      return __instance();
    }

    this.init(sliceNumber);

    __instance(this);
  }

  /**
   * initialize the instance
   * @param sliceNumber
   */
  init(sliceNumber) {
    this.sliceNumber = sliceNumber;
    this.nextSliceToCache = 2;
    this.uncachedMap = {size: sliceNumber};
    this.uncachedList = new ListNode(0);
    this.cachingPool = {};

    this.uncachedMap[1] = new ListNode(1);
    this.uncachedList.next = this.uncachedMap[1];
    for(let i = 2; i <= this.sliceNumber; i++) {
      this.uncachedMap[i-1].next = this.uncachedMap[i] = new ListNode(i);
    }
  }

  /**
   * clear/reset data in the cache manager
   */
  clear(sliceNumber) {
    window.clearInterval(this.autoCacheProcess);
    this.init(sliceNumber);
  }

  /**
   * start auto-cache process for selected series
   * @param caseId
   * @param seriesNumber
   * @param cb callback for successfully caching each slice
   */
  startAutoCacheSeries(caseId, seriesNumber, cb) {
    this.autoCacheProcess = window.setInterval(() => {
      if(this.nextSliceToCache > 0) {
        if(this.getCachingSliceNumber() <= 5) {
          this.cacheSlice(caseId, seriesNumber, this.nextSliceToCache, cb);
        }
      } else {
        console.log('all slice loaded, stop auto-cache process');
        window.clearInterval(this.autoCacheProcess);
      }
    }, 200);
  }

  /**
   * cache a specific slice for selected series
   * @param caseId
   * @param seriesNumber
   * @param index
   * @param cb
   */
  cacheSlice(caseId, seriesNumber, index, cb) {
    // console.log('request to cache slice ' + index);
    if(this.cachingPool.hasOwnProperty(index)) {
      return console.log(`slice${index} is being cached`);
    }

    if(this.uncachedMap[index] === undefined) {
      return console.log(`slice${index} has already been cached`);
    }

    if(this.uncachedMap[index].next !== undefined) {
      this.cachingPool[index] = this.uncachedMap[index];
    }

    this.removeSliceFromUncached(index);

    Meteor.call('getDicom', caseId, seriesNumber, index, (err, image) => {
      if(err) {
        return console.error(err);
      }
      // console.log(`manipulated ${index}`);
      if(this.cachingPool[index] === undefined) {
        if(this.uncachedList.next !== undefined) {
          this.nextSliceToCache = this.uncachedList.next.index;
        } else {
          this.nextSliceToCache = -1;
        }
      } else {
        this.nextSliceToCache = this.cachingPool[index].index;
      }

      delete this.cachingPool[index];

      image.index = index;
      cb(image);
    });
  }

  /**
   * get the number of slices that being cached
   * @returns number
   */
  getCachingSliceNumber() {
    return Object.keys(this.cachingPool).length;
  }

  /**
   * remove a slice from uncached linked list
   * @param index
   */
  removeSliceFromUncached(index) {
    let node = this.uncachedMap[index];

    if(node.next === undefined) {
      // remove tail in the linkedlist
      let p = this.uncachedList;
      while(p.next !== this.uncachedMap[index]) {
        p = p.next;
      }
      p.next = undefined;
    } else {
      // if not tail, logically remove the node
      this.uncachedMap[node.next.index] = node;
      node.index = node.next.index;
      node.next = node.next.next;
    }

    this.uncachedMap.size--;
    delete this.uncachedMap[index];
  }

}

class ListNode {
  constructor(val) {
    this.index = val;
    this.next = undefined;
  }
}
