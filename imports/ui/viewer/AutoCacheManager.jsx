export default class AutoCacheManager {
  constructor(seriesList) {
    this.series = {};

    for(let i = 0; i < seriesList.length; i++) {
      let seriesNumber = seriesList[i].seriesNumber;
      this.series[seriesNumber] = {};

      let series = this.series[seriesNumber];

      series.nextSliceToCache = 2;
      series.uncachedMap = {size: seriesList[i].total};
      series.uncachedList = new ListNode(0);
      series.cachingPool = {};

      series.uncachedMap[1] = new ListNode(1);
      series.uncachedList.next = series.uncachedMap[1];
      for(let j = 2; j <= series.uncachedMap.size; j++) {
        series.uncachedMap[j-1].next = series.uncachedMap[j] = new ListNode(j);
      }
    }
  }

  /**
   * start auto-cache process for selected series
   * @param caseId
   * @param seriesNumber
   * @param cb callback for successfully caching each slice
   */
  startAutoCacheSeries(caseId, seriesNumber, cb) {
    // console.log('auto-caching started at', new Date());
    let series = this.series[seriesNumber];

    window.clearInterval(this.autoCacheProcess);

    this.autoCacheProcess = window.setInterval(() => {
      if(series.nextSliceToCache > 0) {
        if(this.getCachingSliceNumber(seriesNumber) <= 5) {
          this.cacheSlice(caseId, seriesNumber, series.nextSliceToCache, cb);
        }
      } else {
        console.log('All slice loaded, stop auto-cache process');
        // console.log('auto-caching ended at', new Date());
        window.clearInterval(this.autoCacheProcess);
      }
    }, 50);
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
    let series = this.series[seriesNumber];

    if(series.cachingPool.hasOwnProperty(index)) {
      // console.log(`slice${index} is being cached`);
      return;
    }

    if(series.uncachedMap[index] === undefined) {
      // console.log(`slice${index} has already been cached`);
      return;
    }

    if(series.uncachedMap[index].next !== undefined) {
      series.cachingPool[index] = series.uncachedMap[index];
    }

    this.removeSliceFromUncached(seriesNumber, index);

    HTTP.call("GET", "/getDicom", {
      params: {caseId: caseId, seriesNumber: seriesNumber, index: index}}, (err, result) => {
      if(err) {
        return console.error(err);
      }
      let image = result.data;
      image.imageBuf = new Uint8Array(image.imageBuf.data);
      // console.log(`manipulated ${index}`);
      if(series.cachingPool[index] === undefined) {
        if(series.uncachedList.next !== undefined) {
          series.nextSliceToCache = series.uncachedList.next.index;
        } else {
          series.nextSliceToCache = -1;
        }
      } else {
        series.nextSliceToCache = series.cachingPool[index].index;
      }

      delete series.cachingPool[index];

      image.index = index;
      cb(image);
    });
  }

  /**
   * get the number of slices that being cached
   * @returns number
   */
  getCachingSliceNumber(seriesNumber) {
    let series = this.series[seriesNumber];
    return Object.keys(series.cachingPool).length;
  }

  /**
   * remove a slice from uncached linked list
   * @param index
   */
  removeSliceFromUncached(seriesNumber, index) {
    let series = this.series[seriesNumber];
    let node = series.uncachedMap[index];

    if(node.next === undefined) {
      // remove tail in the linkedlist
      let p = series.uncachedList;
      while(p.next !== series.uncachedMap[index]) {
        p = p.next;
      }
      p.next = undefined;
    } else {
      // if not tail, logically remove the node
      series.uncachedMap[node.next.index] = node;
      node.index = node.next.index;
      node.next = node.next.next;
    }

    series.uncachedMap.size--;
    delete series.uncachedMap[index];
  }

}

class ListNode {
  constructor(val) {
    this.index = val;
    this.next = undefined;
  }
}
