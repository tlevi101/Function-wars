export class Pagination {
  page = 1;
  pageSize: number;
  collectionSize: number;
  private SLIDER_SIZE = 4;
  first: number;
  constructor(collectionSize: number) {
    this.first = 2;
    this.pageSize = 7;
    this.collectionSize = collectionSize;
    if (this.pageCount - this.SLIDER_SIZE -1<= 0)
      this.SLIDER_SIZE = this.pageCount - 2 < 0 ? 0 : this.pageCount - 2;
  }
  handlePageTurn() {
    if (this.first > this.page && this.first !== 2)
      this.first = this.first - this.SLIDER_SIZE;
    if (
      this.first + this.SLIDER_SIZE <= this.page &&
      this.first + this.SLIDER_SIZE !== this.pageCount
    )
      this.first = this.first + this.SLIDER_SIZE;
    if (this.pageCount <= this.page + this.SLIDER_SIZE)
      this.first = this.pageCount - this.SLIDER_SIZE;
    if (1 > this.page - this.SLIDER_SIZE) this.first = 2;
  }
  incrementCurrentPageBy(by: number) {
    this.page = this.page + by;
    if (by < 0) this.handlePageTurn();
    else this.handlePageTurn();
  }
  turnPageTo(pageNumber: number) {
    let tmp = this.page;
    this.page = pageNumber;
    if (pageNumber < tmp) this.handlePageTurn();
    if (pageNumber > tmp) this.handlePageTurn();
  }
  get SliderSize(): number {
    return this.SLIDER_SIZE;
  }
  get pageCount(): number {
    return Math.ceil(this.collectionSize / this.pageSize);
  }
}
