export class Pagination {
    SLIDER_SIZE = 4;
    first = 2;
    page = 1;
    pageSize: number;
    collectionSize: number;

    constructor(collectionSize: number, pageSize = 7, page = 1) {
        this.pageSize = pageSize;
        this.collectionSize = collectionSize;
        this.page = page;

        if (this.pageCount - this.SLIDER_SIZE - 1 <= 0) {
            this.SLIDER_SIZE = this.pageCount - 2 < 0 ? 0 : this.pageCount - 2;
        }
    }
    public get SliderSize(): number {
        return this.SLIDER_SIZE;
    }

    public get pageCount(): number {
        return Math.ceil(this.collectionSize / this.pageSize);
    }

    public incrementCurrentPageBy(by: number): void {
        this.page += by;
        this.handlePageTurn();
    }

    public turnPageTo(pageNumber: number): void {
        const tmp = this.page;
        this.page = pageNumber;
        if (pageNumber !== tmp) {
            this.handlePageTurn();
        }
    }

    private handlePageTurn(): void {
        if (this.first > this.page && this.first !== 2) {
            this.first -= this.SLIDER_SIZE;
        }

        if (this.first + this.SLIDER_SIZE <= this.page && this.first + this.SLIDER_SIZE !== this.pageCount) {
            this.first += this.SLIDER_SIZE;
        }

        if (this.pageCount <= this.page + this.SLIDER_SIZE) {
            this.first = this.pageCount - this.SLIDER_SIZE;
        }

        if (1 > this.page - this.SLIDER_SIZE) {
            this.first = 2;
        }
    }
}
