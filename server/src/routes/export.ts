import ExcelJS from 'exceljs';
import { Router } from 'express';
import { getExportRows } from '../db.js';

const router = Router();

const COLUMNS = [
  { header: 'Size (mm)', key: 'size_mm', width: 12 },
  { header: 'Size (Ft)', key: 'size_ft', width: 12 },
  { header: 'Pce/Box', key: 'pce_per_box', width: 10 },
  { header: 'Sqft in Box (Original)', key: 'sqft_in_box_original', width: 22 },
  { header: 'Sqft in Box (Billed)', key: 'sqft_in_box_billed', width: 20 },
  { header: 'Weight', key: 'weight', width: 10 },
  { header: 'SP Unit', key: 'sp_unit', width: 10 },
  { header: 'Product Name', key: 'product_name', width: 30 },
  { header: 'Collection', key: 'collection', width: 18 },
  { header: 'Surface', key: 'surface', width: 14 },
  { header: 'EX-Factory', key: 'ex_factory', width: 14 },
  { header: 'MRP/Sqft', key: 'mrp_per_sqft', width: 12 },
  { header: 'Selling Price/Sqft', key: 'selling_price_per_sqft', width: 18 },
];

router.get('/', async (req, res) => {
  const headerIdParam = req.query.headerId;
  const headerId =
    headerIdParam !== undefined && headerIdParam !== ''
      ? Number(headerIdParam)
      : undefined;

  if (headerId !== undefined && Number.isNaN(headerId)) {
    res.status(400).json({ error: 'Invalid headerId' });
    return;
  }

  const rows = getExportRows(headerId);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Pricelist');

  sheet.columns = COLUMNS;

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8EEF7' },
  };

  for (const row of rows) {
    sheet.addRow(row);
  }

  const date = new Date().toISOString().slice(0, 10);
  const filename = `pricelist_${date}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

export default router;
