export default function Grid(onTileClick: (id: number) => void, tileMappings: Record<number, string>) {
    const numbers = [
        [99, 95, 91, 100, 83, 79, 75, 71],
        [98, 94, 90, 86, 82, 78, 74, 70],
        [97, 93, 89, 85, 81, 77, 73, 69],
        [96, 92, 88, 84, 80, 76, 72, 68],
        [67, 63, 59, 55, 51, 47, 43, 39],
        [66, 62, 58, 54, 50, 46, 42, 38],
        [65, 61, 57, 53, 49, 45, 41, 37],
        [64, 60, 56, 52, 48, 44, 40, 36],
    ];

    return {
        element: (
            <div className="grid">
                {numbers.map((row, rowIndex) => (
                    <div className="grid-row" key={rowIndex}>
                        {row.map((number, colIndex) => (
                            <div
                                className={`grid-tile ${tileMappings[number] ? "mapped" : ""}`}
                                key={colIndex}
                                onClick={() => onTileClick(number)}
                            >
                                {number}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        ),
    };
}
