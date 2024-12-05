
@json
export class Article {
  url!: string;
  adx_keywords!: string;
  subsection!: string;
  column!: string;
  eta_id!: i32;
  section!: string;
  id!: i32;
  asset_id!: i32;
  nytdsection!: string;
  byline!: string;
  type!: string;
  title!: string;
  alt_title!: string;


  @alias("abstract")
  description!: string;
  published_date!: string;
  source!: string;
  updated!: string;
  des_facet!: string[];
  org_facet!: string[];
  per_facet!: string[];
  geo_facet!: string[];
}


@json
export class ArticleResult {
  status!: string;
  copyright!: string;
  num_results!: i32;
  results!: Article[];
}
