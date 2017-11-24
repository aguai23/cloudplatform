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

    this.sliceNumber = sliceNumber;
    this.nextSliceToCache = 1;
    this.uncachedMap = {size: sliceNumber};
    this.uncachedList = new ListNode(0);
    this.cachingPool = {};

    this.uncachedMap[1] = new ListNode(1);
    this.uncachedList.next = this.uncachedMap[1];
    for(let i = 2; i <= this.sliceNumber; i++) {
      this.uncachedMap[i-1].next = this.uncachedMap[i] = new ListNode(i);
    }

    __instance(this);
  }

  startAutoCacheSeries(caseId, seriesNumber, cb) {
    this.autoCacheProcess = window.setInterval(() => {
      if(this.uncachedMap.size > 0 && this.nextSliceToCache > 0) {
        if(this.getCachingSliceNumber() <= 5) {
          this.cacheSlice(caseId, seriesNumber, this.nextSliceToCache, cb);
        }
      } else {
        console.log('all slice loaded, stop auto-cache process');
        window.clearInterval(this.autoCacheProcess);
      }
    }, 200);
  }

  cacheSlice(caseId, seriesNumber, index, cb) {
    // console.log('request to cache slice ' + index);
    if(this.cachingPool.hasOwnProperty(index)) {
      return console.log(`slice${index} is being cached`);
    }

    if(!this.uncachedMap.hasOwnProperty(index)) {
      return console.log(`slice${index} has already been cached`);
    }

    this.cachingPool[index] = this.uncachedMap[index];


    this.removeSliceFromUncached(index);


    Meteor.call('getDicom', caseId, seriesNumber, index, (err, image) => {
      if(err) {
        return console.error(err);
      }

      if(this.cachingPool[index] === undefined) {
        if(this.uncachedList.next !== undefined) {
          // let output = this.uncachedList.index;
          // for(let node = this.uncachedList; node.next !== undefined; node = node.next) {
          //   output += '->' + node.next.index;
          // }
          // console.log(output);
          this.nextSliceToCache = this.uncachedList.next.index;
        } else {
          this.nextSliceToCache = -1;
        }
        this.nextSliceToCache = -1;
      } else {
        this.nextSliceToCache = this.cachingPool[index].index;
      }

      console.log('this.nextSliceToCache', this.nextSliceToCache);

      delete this.cachingPool[index];

      image.index = index;
      cb(image);
    });

  }

  getCachingSliceNumber() {
    return Object.keys(this.cachingPool).length;
  }

  removeSliceFromUncached(index) {
    let node = this.uncachedMap[index];

    // if the removed slice is the last slice
    if(node.next === undefined) {
      this.uncachedList.next = undefined;
    } else {
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
