export class GeneralHelperService {
  static parseSort(sortType: string, sortField: string) {
    let sortObj: any = {
      type: 1,
    };
    if (sortField != undefined && sortType == 'asc') {
      sortObj = {
        [sortField]: 1,
      };
    } else if (sortField != undefined && sortType == 'desc') {
      sortObj = {
        [sortField]: -1,
      };
    }
    return { sortObj };
  }

  static parsePagination(pages: number, limits: number) {
    const page = pages > 0 ? parseInt(pages as any) : 0;
    const limit = limits > 0 ? parseInt(limits as any) : 10;
    return { page, limit };
  }

  static prepareSearchFilter(search: string, fieldName: any) {
    let filterData = [];
    if (fieldName.length == 1) {
      filterData = [
        {
          [fieldName[0]]: {
            $regex: search,
            $options: '$i',
          },
        },
      ];
      return filterData;
    }
    for (let i = 0; i < fieldName.length; i++) {
      const data = {
        [fieldName[i]]: {
          $regex: search,
          $options: '$i',
        },
      };
      filterData.push(data);
    }
    return filterData;
  }

  static prepareResponse(dataItem: any) {
    const tempObjectNew = {
      total_count: 0,
      data: [],
      page: 0,
    };

    if (
      dataItem[0] &&
      dataItem[0].metadata &&
      dataItem[0].metadata[0] &&
      dataItem[0].metadata[0].total_count
    ) {
      tempObjectNew.total_count = dataItem[0].metadata[0].total_count;
    }
    if (dataItem[0] && dataItem[0].data) {
      tempObjectNew.data = dataItem[0].data;
    }
    if (
      dataItem[0] &&
      dataItem[0].metadata &&
      dataItem[0].metadata[0] &&
      dataItem[0].metadata[0].page
    ) {
      tempObjectNew.page = dataItem[0].metadata[0].page;
    }
    return tempObjectNew;
  }

  static dashboardSearchDate(customerSearch: number) {
    const customerSearchByMonth = customerSearch;
    let startOfMonth = 1;
    let endOfMonth = 1;
    let lastStartOfMonth = 1;
    let lastEndOfMonth = 1;
    if (customerSearchByMonth == 1) {
      startOfMonth = 1;
      endOfMonth = 1;
      lastStartOfMonth = 2;
      lastEndOfMonth = 2;
    }
    if (customerSearchByMonth == 2) {
      startOfMonth = 3;
      endOfMonth = 1;
      lastStartOfMonth = 6;
      lastEndOfMonth = 3;
    }
    if (customerSearchByMonth == 3) {
      startOfMonth = 6;
      endOfMonth = 1;
      lastStartOfMonth = 12;
      lastEndOfMonth = 6;
    }
    if (customerSearchByMonth == 4) {
      startOfMonth = 12;
      endOfMonth = 1;
      lastStartOfMonth = 24;
      lastEndOfMonth = 12;
    }

    return {
      startOfMonth,
      endOfMonth,
      lastStartOfMonth,
      lastEndOfMonth,
    };
  }
}
