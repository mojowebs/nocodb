import Noco from '../noco/Noco';
import { CacheGetType, CacheScope, MetaTable } from '../utils/globals';
import View from './View';
import NocoCache from '../noco-cache/NocoCache';

export default class GalleryViewColumn {
  id: string;
  title?: string;
  show?: boolean;
  order?: number;

  fk_view_id: string;
  fk_column_id: string;
  project_id?: string;
  base_id?: string;

  constructor(data: GalleryViewColumn) {
    Object.assign(this, data);
  }

  public static async get(galleryViewColumnId: string, ncMeta = Noco.ncMeta) {
    let view =
      galleryViewColumnId &&
      (await NocoCache.get(
        `${CacheScope.GALLERY_VIEW_COLUMN}:${galleryViewColumnId}`,
        CacheGetType.TYPE_OBJECT
      ));
    if (!view) {
      view = await ncMeta.metaGet2(
        null,
        null,
        MetaTable.GALLERY_VIEW_COLUMNS,
        galleryViewColumnId
      );
      await NocoCache.set(
        `${CacheScope.GALLERY_VIEW_COLUMN}:${galleryViewColumnId}`,
        view
      );
    }
    return view && new GalleryViewColumn(view);
  }
  static async insert(
    column: Partial<GalleryViewColumn>,
    ncMeta = Noco.ncMeta
  ) {
    const insertObj = {
      fk_view_id: column.fk_view_id,
      fk_column_id: column.fk_column_id,
      order: await ncMeta.metaGetNextOrder(MetaTable.GALLERY_VIEW_COLUMNS, {
        fk_view_id: column.fk_view_id
      }),
      show: column.show,
      project_id: column.project_id,
      base_id: column.base_id
    };

    if (!(column.project_id && column.base_id)) {
      const viewRef = await View.get(column.fk_view_id, ncMeta);
      insertObj.project_id = viewRef.project_id;
      insertObj.base_id = viewRef.base_id;
    }

    const { id, fk_column_id } = await ncMeta.metaInsert2(
      null,
      null,
      MetaTable.GALLERY_VIEW_COLUMNS,
      insertObj
    );

    await NocoCache.set(
      `${CacheScope.GALLERY_VIEW_COLUMN}:${fk_column_id}`,
      id
    );

    await NocoCache.appendToList(
      CacheScope.GALLERY_VIEW_COLUMN,
      [column.fk_view_id],
      `${CacheScope.GALLERY_VIEW_COLUMN}:${id}`
    );

    return this.get(id, ncMeta);
  }

  public static async list(
    viewId: string,
    ncMeta = Noco.ncMeta
  ): Promise<GalleryViewColumn[]> {
    let views = await NocoCache.getList(CacheScope.GALLERY_VIEW_COLUMN, [
      viewId
    ]);
    if (!views.length) {
      views = await ncMeta.metaList2(
        null,
        null,
        MetaTable.GALLERY_VIEW_COLUMNS,
        {
          condition: {
            fk_view_id: viewId
          },
          orderBy: {
            order: 'asc'
          }
        }
      );
      await NocoCache.setList(CacheScope.GALLERY_VIEW_COLUMN, [viewId], views);
    }
    views.sort(
      (a, b) =>
        (a.order != null ? a.order : Infinity) -
        (b.order != null ? b.order : Infinity)
    );
    return views?.map(v => new GalleryViewColumn(v));
  }
}