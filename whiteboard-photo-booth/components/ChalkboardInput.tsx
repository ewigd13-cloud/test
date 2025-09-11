import React, { useCallback, useState, useRef, useEffect } from 'react';
import { ListIcon, ImportIcon, TrashIcon, CloseIcon } from './Icons';

interface WhiteboardGridInputProps {
  texts: string[];
  setTexts: (texts: string[]) => void;
  disabled?: boolean;
}

const ListSelectionModal: React.FC<{
  isOpen: boolean;
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
  onDelete: (value: string) => void;
}> = ({ isOpen, options, onSelect, onClose, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredOptions = options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">項目を選択</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="絞り込み検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter options"
                    />
                </div>
                <ul className="max-h-72 overflow-y-auto border rounded-md bg-gray-50">
                    {options.length > 0 ? (
                        filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <li 
                                    key={option} 
                                    className="flex justify-between items-center p-3 hover:bg-blue-100 border-b last:border-b-0 transition-colors text-gray-700"
                                >
                                    <span 
                                        onClick={() => onSelect(option)} 
                                        className="cursor-pointer flex-grow"
                                        tabIndex={0}
                                        onKeyPress={(e) => e.key === 'Enter' && onSelect(option)}
                                    >
                                        {option}
                                    </span>
                                     <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(option);
                                        }} 
                                        className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 ml-2 flex-shrink-0"
                                        aria-label={`Delete option: ${option}`}
                                        title="Delete"
                                    >
                                        <TrashIcon />
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="p-3 text-gray-500">一致する項目がありません。</li>
                        )
                    ) : (
                      <li className="p-3 text-gray-500">保存されている項目がありません。「.txtからインポート」ボタンを使って追加してください。</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

const LOCAL_STORAGE_KEY_FIELD_1 = 'whiteboard-saved-options-field-1';
const LOCAL_STORAGE_KEY_FIELD_2 = 'whiteboard-saved-options-field-2';
const LOCAL_STORAGE_KEY_FIELD_3 = 'whiteboard-saved-options-field-3';
const DEFAULT_OPTIONS_FIELD_3 = ['定期点検', '6ヶ月点検', '年次点検', '定期清掃'];

/**
 * Safely retrieves and parses a string array from localStorage.
 * If data is corrupted, it removes the item and returns the default.
 * @param key The localStorage key.
 * @param defaultOptions The default array to return on failure or if not found.
 * @returns The parsed string array or the default.
 */
const getSavedOptions = (key: string, defaultOptions: string[] = []): string[] => {
  try {
    const items = window.localStorage.getItem(key);
    if (items) {
      const parsed = JSON.parse(items);
      // Basic validation to ensure it's an array of strings
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed;
      }
      throw new Error("Stored data is not a valid string array.");
    }
    return defaultOptions;
  } catch (error) {
    console.error(`Failed to parse saved options for key "${key}", resetting.`, error);
    window.localStorage.removeItem(key);
    return defaultOptions;
  }
};

export const WhiteboardGridInput: React.FC<WhiteboardGridInputProps> = ({ texts, setTexts, disabled = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTargetIndex, setCurrentTargetIndex] = useState<number | null>(null);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  
  const [savedOptionsForField1, setSavedOptionsForField1] = useState<string[]>(() =>
    getSavedOptions(LOCAL_STORAGE_KEY_FIELD_1)
  );

  const [savedOptionsForField2, setSavedOptionsForField2] = useState<string[]>(() =>
    getSavedOptions(LOCAL_STORAGE_KEY_FIELD_2)
  );
  
  const [savedOptionsForField3, setSavedOptionsForField3] = useState<string[]>(() =>
    getSavedOptions(LOCAL_STORAGE_KEY_FIELD_3, DEFAULT_OPTIONS_FIELD_3)
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY_FIELD_1, JSON.stringify(savedOptionsForField1));
    } catch (error)      {
      console.error("Failed to save options for field 1:", error);
    }
  }, [savedOptionsForField1]);
  
  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY_FIELD_2, JSON.stringify(savedOptionsForField2));
    } catch (error)      {
      console.error("Failed to save options for field 2:", error);
    }
  }, [savedOptionsForField2]);
  
  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY_FIELD_3, JSON.stringify(savedOptionsForField3));
    } catch (error)      {
      console.error("Failed to save options for field 3:", error);
    }
  }, [savedOptionsForField3]);

  const handleTextChange = (index: number, value: string) => {
    const newTexts = [...texts];
    newTexts[index] = value;
    setTexts(newTexts);
  };

  const handleTextareaInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto'; // Reset height to recalculate
    textarea.style.height = `${textarea.scrollHeight}px`; // Set to content height
  }, []);

  const handleSelectClick = (index: number) => {
    setCurrentTargetIndex(index);
    setIsModalOpen(true);
  };
  
  const handleImportClick1 = () => {
    fileInputRef1.current?.click();
  };
  
  const handleImportClick2 = () => {
    fileInputRef2.current?.click();
  };

  const handleFileRead = (
    event: React.ChangeEvent<HTMLInputElement>, 
    setOptions: React.Dispatch<React.SetStateAction<string[]>>,
    listName: string
  ) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              const text = e.target?.result as string;
              const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
              const uniqueLines = Array.from(new Set(lines));
              
              setOptions(uniqueLines);

              if (uniqueLines.length > 0) {
                  alert(`「${listName}」リストがファイルの内容で更新され、${uniqueLines.length}件の項目が保存されました。次回以降も利用できます。`);
              } else {
                  alert('ファイルが空か、有効な項目がなかったためリストは更新されませんでした。');
              }
          };
          reader.onerror = () => {
              console.error("Failed to read file");
              alert("選択されたファイルを読み込めませんでした。");
          };
          reader.readAsText(file);
      }
      if(event.target) {
          event.target.value = '';
      }
  };

  const handleModalSelect = (value: string) => {
    if (currentTargetIndex !== null) {
        handleTextChange(currentTargetIndex, value);
    }
    setIsModalOpen(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleAddItemToList = (index: number, value: string) => {
    const textToAdd = value.trim();
    if (!textToAdd) {
        alert("保存するテキストを入力してください。");
        return;
    }

    let options: string[] = [];
    let setOptions: React.Dispatch<React.SetStateAction<string[]>> | null = null;
    let listName = '';

    if (index === 1) {
        options = savedOptionsForField1;
        setOptions = setSavedOptionsForField1;
        listName = texts[0];
    } else if (index === 3) {
        options = savedOptionsForField2;
        setOptions = setSavedOptionsForField2;
        listName = texts[2];
    } else if (index === 5) {
        options = savedOptionsForField3;
        setOptions = setSavedOptionsForField3;
        listName = texts[4];
    }

    if (setOptions) {
        const isDuplicate = options.some(opt => opt.toLowerCase() === textToAdd.toLowerCase());
        if (isDuplicate) {
            alert(`「${textToAdd}」は既に「${listName}」リストに保存されています。`);
        } else {
            setOptions(prev => [textToAdd, ...prev]);
            alert(`「${textToAdd}」を「${listName}」リストに保存しました。次回から選択できます。`);
        }
    }
  };

  const getModalProps = () => {
    if (currentTargetIndex === 1) {
      return {
        options: savedOptionsForField1,
        onDelete: (optionToDelete: string) => setSavedOptionsForField1(prev => prev.filter(opt => opt !== optionToDelete)),
      };
    }
    if (currentTargetIndex === 3) {
      return {
        options: savedOptionsForField2,
        onDelete: (optionToDelete: string) => setSavedOptionsForField2(prev => prev.filter(opt => opt !== optionToDelete)),
      };
    }
    if (currentTargetIndex === 5) {
      return {
        options: savedOptionsForField3,
        onDelete: (optionToDelete: string) => setSavedOptionsForField3(prev => prev.filter(opt => opt !== optionToDelete)),
      };
    }
    return { options: [], onDelete: () => {} };
  };
  const modalProps = getModalProps();

  const commonInputClasses = "w-full bg-transparent text-center text-lg font-marker text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition py-3 px-1";
  const commonTextareaClasses = `${commonInputClasses} resize-none overflow-hidden`;

  return (
    <div className={`bg-gray-100 p-4 rounded-lg shadow-inner transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            ホワイトボードのメッセージ:
        </label>
        <div className="grid grid-cols-[3fr_7fr] gap-2 items-start">
            {texts.map((text, index) => {
              if ([0, 2, 4, 6].includes(index)) {
                return (
                  <textarea
                    key={index}
                    id={`whiteboard-input-${index}`}
                    value={text}
                    readOnly
                    rows={1}
                    className={`${commonTextareaClasses} bg-gray-200 cursor-not-allowed`}
                    aria-label={`Whiteboard label for ${text}`}
                  />
                );
              }

              if (index === 7) {
                return (
                  <input
                    key={index}
                    id={`whiteboard-input-${index}`}
                    type="date"
                    value={text}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    className={commonInputClasses}
                    aria-label="Whiteboard date input"
                  />
                );
              }
              
              const isListEnabled = index === 1 || index === 3 || index === 5;

              return (
                <div key={index} className="flex w-full items-center gap-2">
                    {isListEnabled && (
                        <button
                            onClick={() => handleAddItemToList(index, text)}
                            disabled={disabled}
                            className="flex-shrink-0 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-sm"
                            title="現在の項目をリストに保存"
                        >
                            SET
                        </button>
                    )}
                    <div className="relative w-full">
                        <textarea
                            id={`whiteboard-input-${index}`}
                            value={text}
                            onChange={(e) => handleTextChange(index, e.target.value)}
                            onInput={handleTextareaInput}
                            rows={1}
                            className={`${commonTextareaClasses} ${isListEnabled ? 'pr-12' : ''}`}
                            placeholder="..."
                            aria-label={`Whiteboard input cell ${index + 1}`}
                        />
                        {isListEnabled && (
                            <button
                                onClick={() => handleSelectClick(index)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-200 transition-colors"
                                aria-label="Select from saved options"
                                title="Select from list"
                                disabled={disabled}
                            >
                                <ListIcon />
                            </button>
                        )}
                    </div>
                </div>
              );
            })}
        </div>
        <div className="mt-4 flex justify-center flex-wrap gap-2">
            <button
                onClick={handleImportClick1}
                className="flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs"
            >
                <ImportIcon />
                <span className="ml-2">{texts[0]}</span>
            </button>
            <button
                onClick={handleImportClick2}
                className="flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs"
            >
                <ImportIcon />
                <span className="ml-2">{texts[2]}</span>
            </button>
        </div>
        <input
            type="file"
            ref={fileInputRef1}
            onChange={(e) => handleFileRead(e, setSavedOptionsForField1, texts[0])}
            className="hidden"
            accept=".txt"
        />
        <input
            type="file"
            ref={fileInputRef2}
            onChange={(e) => handleFileRead(e, setSavedOptionsForField2, texts[2])}
            className="hidden"
            accept=".txt"
        />
        <ListSelectionModal 
            isOpen={isModalOpen}
            options={modalProps.options}
            onSelect={handleModalSelect}
            onClose={handleModalClose}
            onDelete={modalProps.onDelete}
        />
    </div>
  );
};