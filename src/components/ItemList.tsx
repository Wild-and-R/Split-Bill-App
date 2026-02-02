'use client';

import { useState, useEffect } from 'react';

interface Item {
  name: string;
  price: number;
  assignedTo?: number[]; // indexes of people
}

interface ItemListProps {
  initialItems: Item[];
}

type SplitMode = 'equal' | 'perItem';

export default function ItemList({ initialItems }: ItemListProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [pax, setPax] = useState<number>(1);

  const [taxRate, setTaxRate] = useState<number>(10);
  const [serviceRate, setServiceRate] = useState<number>(5);

  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [people, setPeople] = useState<string[]>(['Person 1']);

  useEffect(() => {
    if (splitMode === 'equal') {
      setPax(people.length || 1);
    }
  }, [splitMode, people.length]);

  const updateItem = (
    index: number,
    field: keyof Item,
    value: string | number | number[]
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', price: 0, assignedTo: [] }]);
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
  const tax = Math.round(subtotal * (taxRate / 100));
  const serviceCharge = Math.round(subtotal * (serviceRate / 100));
  const totalPrice = subtotal + tax + serviceCharge;

  const roundUnit = 100;
  const roundedTotal = Math.round(totalPrice / roundUnit) * roundUnit;
  const roundingDifference = roundedTotal - totalPrice;

  const perPersonEqual = pax > 0 ? Math.ceil(roundedTotal / pax) : 0;

  const taxPresets = [0, 5, 10];
  const servicePresets = [0, 5, 10];

  const perPersonTotals = people.map((_, idx) => {
    const itemTotal = items.reduce((sum, item) => {
      if (!item.assignedTo || item.assignedTo.length === 0) return sum;
      if (!item.assignedTo.includes(idx)) return sum;
      return sum + item.price / item.assignedTo.length;
    }, 0);

    const ratio = subtotal > 0 ? itemTotal / subtotal : 0;
    const taxShare = tax * ratio;
    const serviceShare = serviceCharge * ratio;

    const personTotal = itemTotal + taxShare + serviceShare;
    const roundingRatio = totalPrice > 0 ? personTotal / totalPrice : 0;

    return Math.round(personTotal + roundingDifference * roundingRatio);
  });

  return (
    <div className="mt-8 bg-white text-gray-800 rounded-2xl shadow-inner p-4 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Review & Split</h3>

      {/* Split Mode */}
      <div className="mb-6 flex gap-2">
        {(['equal', 'perItem'] as SplitMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setSplitMode(mode)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border
              ${
                splitMode === mode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
          >
            {mode === 'equal' ? 'Equal Split' : 'Split Per Item'}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-gray-50 p-2 rounded-lg space-y-1">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(index, 'name', e.target.value)}
                className="flex-grow bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-sm"
              />

              <div className="flex items-center bg-white border rounded px-2">
                <span className="text-xs text-gray-400 mr-1">Rp</span>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    updateItem(index, 'price', parseInt(e.target.value) || 0)
                  }
                  className="w-20 text-right text-sm outline-none"
                />
              </div>
            </div>

            {splitMode === 'perItem' && (
              <div className="flex flex-wrap gap-1">
                {people.map((person, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      const assigned = item.assignedTo || [];
                      updateItem(
                        index,
                        'assignedTo',
                        assigned.includes(pIdx)
                          ? assigned.filter((i) => i !== pIdx)
                          : [...assigned, pIdx]
                      );
                    }}
                    className={`px-2 py-0.5 rounded text-xs border
                      ${
                        item.assignedTo?.includes(pIdx)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-300'
                      }`}
                  >
                    {person}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        className="mt-3 w-full border border-dashed border-blue-300 text-blue-600 rounded-lg py-2 text-sm font-semibold hover:bg-blue-50"
      >
        + Add item manually
      </button>

      {/* People */}
      {splitMode === 'perItem' && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">People</h4>

          {people.map((person, idx) => (
            <input
              key={idx}
              value={person}
              onChange={(e) => {
                const copy = [...people];
                copy[idx] = e.target.value;
                setPeople(copy);
              }}
              className="w-full p-2 border rounded text-sm text-gray-800"
            />
          ))}

          <button
            onClick={() =>
              setPeople([...people, `Person ${people.length + 1}`])
            }
            className="text-sm font-semibold text-blue-600"
          >
            + Add person
          </button>
        </div>
      )}

      {/* Totals */}
      <div className="mt-6 pt-4 border-t space-y-3 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>

        {/* Tax */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>Tax</span>
            {taxPresets.map((p) => (
              <button
                key={p}
                onClick={() => setTaxRate(p)}
                className={`px-2 py-0.5 text-xs rounded border
                  ${taxRate === p ? 'bg-blue-600 text-white' : 'bg-white'}`}
              >
                {p}%
              </button>
            ))}
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(+e.target.value || 0)}
              className="w-14 border rounded text-right px-1"
            />
            %
          </div>
          <span>Rp {tax.toLocaleString('id-ID')}</span>
        </div>

        {/* Service */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>Service</span>
            {servicePresets.map((p) => (
              <button
                key={p}
                onClick={() => setServiceRate(p)}
                className={`px-2 py-0.5 text-xs rounded border
                  ${serviceRate === p ? 'bg-blue-600 text-white' : 'bg-white'}`}
              >
                {p}%
              </button>
            ))}
            <input
              type="number"
              value={serviceRate}
              onChange={(e) => setServiceRate(+e.target.value || 0)}
              className="w-14 border rounded text-right px-1"
            />
            %
          </div>
          <span>Rp {serviceCharge.toLocaleString('id-ID')}</span>
        </div>

        <div className="pt-2 border-t space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Total</span>
            <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
          </div>

          {/* Rounded total shown both up and down */}
          {roundingDifference !== 0 && (
            <>
              <div className="flex justify-between font-semibold text-base">
                <span>Rounded Total</span>
                <span className="text-blue-600">
                  Rp {roundedTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="text-xs text-gray-400 text-right">
                Rounded {roundingDifference > 0 ? 'up' : 'down'} by Rp{' '}
                {Math.abs(roundingDifference).toLocaleString('id-ID')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Result */}
      {splitMode === 'equal' ? (
        <div className="bg-blue-50 p-4 rounded-xl mt-4">
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={1}
              value={pax}
              onChange={(e) => setPax(Math.max(1, +e.target.value))}
              className="w-16 p-2 border rounded"
            />
            <p className="text-sm">
              Per person:{' '}
              <strong>Rp {perPersonEqual.toLocaleString('id-ID')}</strong>
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 p-4 rounded-xl mt-4 space-y-2">
          {people.map((person, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{person}</span>
              <strong>Rp {perPersonTotals[idx].toLocaleString('id-ID')}</strong>
            </div>
          ))}
        </div>
      )}

      <button className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700">
        Share to WhatsApp
      </button>
    </div>
  );
}
