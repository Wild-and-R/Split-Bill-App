'use client';

import { useState } from 'react';

interface Item {
  name: string;
  price: number;
}

interface ItemListProps {
  initialItems: Item[];
}

export default function ItemList({ initialItems }: ItemListProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [pax, setPax] = useState<number>(1);
  const [taxRate, setTaxRate] = useState<number>(10); // %

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
  const tax = Math.round(subtotal * (taxRate / 100));
  const totalPrice = subtotal + tax;

  const perPerson =
    pax > 0 ? Math.ceil(totalPrice / pax) : 0;

  const taxPresets = [0, 5, 10];

  const addItem = () => {
  setItems([
    ...items,
    { name: '', price: 0 }
  ]);
};

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-inner p-4 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Review & Split
      </h3>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg"
          >
            <input
              type="text"
              value={item.name}
              onChange={(e) =>
                updateItem(index, 'name', e.target.value)
              }
              className="flex-grow bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-gray-700 text-sm py-1"
            />
            <div className="flex items-center bg-white border rounded px-2">
              <span className="text-gray-400 text-xs mr-1">Rp</span>
              <input
                type="number"
                value={item.price}
                onChange={(e) =>
                  updateItem(
                    index,
                    'price',
                    parseInt(e.target.value) || 0
                  )
                }
                className="w-20 outline-none text-right text-sm py-1 text-gray-700"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-3 w-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 border border-dashed border-blue-300 rounded-lg py-2 hover:bg-blue-50 transition">
        <span className="text-lg leading-none">＋</span>
        Add item manually
      </button>

      {/* Totals */}
      <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Tax</span>

            {/* Preset buttons */}
            <div className="flex gap-1">
              {taxPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTaxRate(preset)}
              className={`px-2 py-0.5 rounded text-xs font-semibold border transition
                ${
                  taxRate === preset
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                }`}>
              {preset}%
            </button>
            ))}
            </div>

            {/* Manual input */}
            <input
            type="number"
            min={0}
            value={taxRate}
            onChange={(e) =>
            setTaxRate(Math.max(0, Number(e.target.value)))}
            className="w-14 px-1 py-0.5 border rounded text-right text-sm"/>
            <span>%</span>
          </div>

          <span>Rp {tax.toLocaleString('id-ID')}</span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="font-medium text-gray-700">
            Total Bill
          </span>
          <span className="text-xl font-bold text-blue-600">
            Rp {totalPrice.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Quick Split */}
        <div className="bg-blue-50 p-4 rounded-xl mt-4">
          <label className="block text-xs font-semibold text-blue-700 uppercase mb-2">
            Quick Split (Equal)
          </label>

          <div className="flex items-center gap-4">
            <input
              type="number"
              min={1}
              value={pax}
              onChange={(e) =>
                setPax(Math.max(1, Number(e.target.value)))
              }
              className="w-16 p-2 rounded border text-gray-700 text-sm"
            />

            <p className="text-sm text-blue-800">
              Per person:{' '}
              <span className="font-bold">
                Rp {perPerson.toLocaleString('id-ID')}
              </span>
            </p>
          </div>
        </div>
      </div>

      <button className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors">
        Share to WhatsApp
      </button>
    </div>
  );
}
