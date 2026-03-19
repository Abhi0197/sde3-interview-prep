# Low-Level Design Case Studies

## Overview

Case studies are the practical testing ground for LLD concepts. Unlike generic design patterns, case studies root knowledge in realistic problems you'll encounter in real interviews. SDE 3 interviews often present variations of these classic designs, expecting you to propose solutions, discuss tradeoffs, and code core components.

## Case Study 1: Parking Lot Management System

### Problem Statement

Design a parking lot system for a multi-level parking garage with:
- Multiple levels, each with parking spots
- Spots for different vehicle types (compact, regular, large)
- Entry/exit gates with payment processing
- Real-time spot availability tracking
- Generate parking receipts and parking history

### Key Design Patterns
- **Factory Pattern**: Create vehicles, payments
- **Strategy Pattern**: Different pricing strategies
- **Observer Pattern**: Notify about availability changes
- **Singleton Pattern**: Single parking lot instance

### Core Components
- ParkingLot (main controller)
- Level (represents one floor)
- Spot (individual space)
- Vehicle (car, bike, truck)
- Payment processor
- Ticket manager

### Interview Variations
- "Support reserved spots for premium users"
- "Handle monthly subscriptions + hourly parking"
- "Track parking statistics for management"
- "Predict when spots will be full"

---

## Case Study 2: Chess Game

### Problem Statement

Design a chess game system supporting:
- Two-player local or networked play
- Move validation (only legal moves allowed)
- Game state tracking (whose turn, game over condition)
- Undo/redo capability
- Move history logging
- Save/load game state

### Design Challenges
- **Complexity**: 6 different piece types, each with unique movement rules
- **Validation**: Ensure no moves into check
- **Performance**: Efficient move generation and board evaluation
- **Extensibility**: Support chess variants (Chess960, 3-check, etc.)

### Key Classes
- Piece (abstract base)
- King, Queen, Rook, Bishop, Knight, Pawn (subclasses)
- Board (8x8 grid management)
- Game (game state and rules)
- Move (encapsulates from/to positions)

### Advanced Topics
- Checkmate vs stalemate detection
- En passant and castling rules
- Threefold repetition (draw condition)
- Bitboard representation for performance

### Follow-up Questions
- "How would you add a 60-minute time limit?"
- "Support spectators watching the game?"
- "Implement AI opponent with minimax?"

---

## Case Study 3: Vending Machine

### Problem Statement

Design a vending machine with:
- Item selection by code (A1, B2, etc.)
- Money insertion (bills/coins)
- Change calculation and return
- Inventory management
- Out-of-stock handling
- Transaction logging

### Design Patterns
- **State Pattern**: Different machine states (idle, accepting-payment, dispensing)
- **Command Pattern**: Item selection as commands
- **Template Method**: Common transaction flow

### State Machine
- **Idle**: Waiting for user
- **Accepting Payment**: User inserting money
- **Dispensing**: Item is being dispensed
- **Returning Change**: Calculating and returning coins

### Key Tradeoffs
- **Simplicity vs Extensibility**: How to add new payment methods?
- **Reliability vs Performance**: Ensure payment before releasing item
- **User Experience**: Clear error messages and feedback

---

## Design Principles Applied

### SOLID Principles
- **S**ingle Responsibility: Each class has one reason to change
- **O**pen/Closed: Open for extension (new game variants), closed for modification
- **L**iskov Substitution: Subclasses can substitute parent (all pieces, all vehicles)
- **I**nterface Segregation: Specific interfaces (Vehicle vs Movable)
- **D**ependency Inversion: Depend on abstractions, not concretions

### Error Handling
- Graceful degradation when components fail
- Transaction rollback on failure
- User-friendly error messages

### Testing Strategy
- Unit tests for each component
- Integration tests for workflows
- Edge case tests (boundary conditions)

---

## Real Interview Tips

1. **Start with clarification**: "Is this for local play or networked?" "How many colors?"
2. **Draw simple diagrams**: Use boxes and arrows, not UML
3. **Name deliberately**: Avoid generic names like "Process" or "Handler"
4. **Discuss tradeoffs**: "We could use a queue, but that's less scalable than..."
5. **Think about scale**: "For 10,000 parking spots, we'd shard by level"
6. **Leave room for extension**: Use inheritance or composition for variants
7. **Consider failure modes**: "What if payment processor is down?"
8. **Estimate complexity**: Mention time and space complexity of key operations

---

## Interview Duration

- **Time allocation**: 5-10 minutes for problem clarification, 15-25 minutes design, 15-25 minutes implementation
- **Difficulty**: Medium-Hard
- **Focus**: Code quality, design patterns, handling edge cases
- **Expectations**: Working implementation of core features, not perfect error handling

---

## Extension Ideas

### Parking Lot Extensions
- Support for handicapped parking
- EV charging station integration
- Dynamic pricing based on demand
- License plate recognition

### Chess Extensions
- Online multiplayer
- Rating/Elo system
- Opening/endgame databases
- Tournament management

### Vending Machine Extensions
- Facial recognition for age verification
- Predictive restocking
- Multiple currencies
- Loyalty rewards system

---

## Deep Dive Interview Questions & Answers

### Parking Lot System Q&A

**Q1: How would you handle a scenario where two users try to park in the same spot simultaneously?**

**Answer**: 
```
Race condition solution:
1. Use database transaction or lock mechanism
2. At entry gate, when vehicle enters:
   - Query available spot of appropriate size
   - Atomically mark spot as RESERVED
   - Assign to vehicle
   
If using optimistic locking (no locks):
   - Read spot version
   - Attempt to mark with version check
   - If failed (version changed), retry with different spot
   
Better approach: Synchronized block or database lock
synchronized(level) {
    Spot spot = level.findAvailableSpot(vehicleSize);
    if (spot != null) {
        spot.assignVehicle(vehicle);
        ticket.setSpot(spot);
    }
}
```

**Q2: How would you track which vehicles are parked where if someone steals a license plate?**

**Answer**:
```
Multiple identifiers:
- License plate (primary but can be stolen)
- Entry time + color + model (composite key)
- RFID tag on parking ticket
- Timestamp + vehicle type

Implementation:
Map<String, Vehicle> byLicensePlate;
Map<String, Vehicle> byRFIDTag;        // Primary
Map<String, Vehicle> byEntryTimeAndColor;

When querying, first check RFID (most reliable):
Vehicle findVehicle(String rfidTag) {
    return byRFIDTag.get(rfidTag);
}

Fallback if ticket lost:
List<Vehicle> findVehiclesByDescription(Color color, String model, LocalTime entryTime) {
    return vehicles.stream()
        .filter(v -> v.getColor() == color && 
                     v.getModel().equals(model) &&
                     v.getEntryTime().toLocalTime().equals(entryTime))
        .collect(toList());
}
```

**Q3: Discuss OOP design - why use separate classes for different vehicle types instead of a single Vehicle class with a type field?**

**Answer**:
```
Using inheritance (good):
abstract class Vehicle {
    abstract int getSpotSize();
}
class Compact extends Vehicle { 
    public int getSpotSize() { return 1; } 
}
class Truck extends Vehicle { 
    public int getSpotSize() { return 3; } 
}

Why better than single class with type:
1. Type checking: compiler catches errors
2. Polymorphism: different logic per type automatically
3. Extensibility: easy to add new vehicle type
4. Less chance of incomplete if-else statements

Using single class (bad):
class Vehicle {
    String type;  // "compact", "truck"
    public int getSpotSize() {
        if (type.equals("compact")) return 1;
        if (type.equals("truck")) return 3;
        // Easy to miss a case
    }
}
```

**Q4: How do you handle the payment system? What if payment processor goes down?**

**Answer**:
```
Two approaches:

Approach 1: Strict (blocks exit):
- When exiting, call PaymentService
- If service down, vehicle cannot leave
- User complains, eventually retry and succeeds

Approach 2: Tolerant (allows exit):
@FunctionalInterface
interface PaymentStrategy {
    PaymentResult processPayment(double amount) throws PaymentException;
}

class RobustPaymentService implements PaymentStrategy {
    @Override
    public PaymentResult processPayment(double amount) {
        try {
            return primaryPaymentGateway.charge(amount);
        } catch (ServiceUnavailableException e) {
            logger.error("Primary gateway down, trying backup", e);
            try {
                return backupPaymentGateway.charge(amount);
            } catch (Exception e2) {
                // Log transaction, allow exit, bill later
                logger.error("Both gateways failed", e2);
                transactionQueue.add(new PendingTransaction(vehicleId, amount));
                return new PaymentResult(false, "Deferred billing");
            }
        }
    }
}

// In main exit logic:
PaymentResult result = paymentService.processPayment(hours * HOURLY_RATE);
if (result.isSuccessful()) {
    releaseVehicle(vehicle);
} else if (result.isDeferredBilling()) {
    releaseVehicle(vehicle);  // Allow exit, charge later
    sendNotification(vehicle.getOwnerEmail(), 
        "Payment processing delayed, will be charged");
} else {
    blockExit(vehicle);  // Hard failure, block
}
```

---

### Chess Game Q&A

**Q1: How do you validate that a move doesn't leave your own king in check?**

**Answer**:
```java
public boolean isValidMove(Position from, Position to) {
    // 1. Check basic move validity for piece
    if (!isLegalMoveForPiece(from, to)) return false;
    
    // 2. Simulate the move on a copy of the board
    Board testBoard = board.copy();
    testBoard.movePiece(from, to);
    
    // 3. Check if OUR king is in check after move
    if (testBoard.isKingInCheck(currentPlayer)) {
        return false;  // Illegal - leaves own king in check
    }
    
    return true;
}

// Alternative using "make move, validate, unmake":
public boolean isValidMove(Position from, Position to) {
    board.movePiece(from, to);
    boolean valid = !board.isKingInCheck(currentPlayer);
    board.undoMove();
    return valid;
}
```

**Q2: Implement checkmate detection**

**Answer**:
```java
public boolean isCheckmate() {
    if (!isKingInCheck(currentPlayer)) {
        return false;  // Not even in check
    }
    
    // In check, check if ANY legal move exists
    for (Piece piece : getCurrentPlayerPieces()) {
        for (Position possibleMove : getAllReachableMoves(piece)) {
            if (isValidMove(piece.getPosition(), possibleMove)) {
                return false;  // Found escape move
            }
        }
    }
    
    return true;  // In check && no escape = checkmate
}

public boolean isStalemate() {
    if (isKingInCheck(currentPlayer)) {
        return false;  // Stalemate is NOT in check
    }
    
    // Not in check, check if ANY legal move exists
    for (Piece piece : getCurrentPlayerPieces()) {
        for (Position possibleMove : getAllReachableMoves(piece)) {
            if (isValidMove(piece.getPosition(), possibleMove)) {
                return false;  // Found legal move
            }
        }
    }
    
    return true;  // Not in check && no legal moves = stalemate
}
```

**Q3: How do you implement castling?**

**Answer**:
```java
public boolean canCastle(CastleSide side) {
    King myKing = getKing(currentPlayer);
    Rook rook = getRook(side);
    
    // Conditions for castling:
    // 1. King hasn't moved yet
    if (myKing.hasMoved()) return false;
    
    // 2. Rook hasn't moved yet
    if (rook.hasMoved()) return false;
    
    // 3. King not in check
    if (isKingInCheck(currentPlayer)) return false;
    
    // 4. No pieces between king and rook
    List<Position> between = getSquaresBetween(myKing.getPosition(), rook.getPosition());
    if (!between.stream().allMatch(board::isEmpty)) {
        return false;
    }
    
    // 5. King doesn't pass through check
    Position kingStartPos = myKing.getPosition();
    Position kingEndPos = (side == CastleSide.KINGSIDE) ? new Position(7, 6) : new Position(7, 2);
    
    for (Position intermediate : getPath(kingStartPos, kingEndPos)) {
        // Temporarily move king and check if in check
        board.movePiece(kingStartPos, intermediate);
        boolean inCheck = isKingInCheck(currentPlayer);
        board.movePiece(intermediate, kingStartPos);
        
        if (inCheck) return false;
    }
    
    return true;
}

public void performCastling(CastleSide side) {
    King myKing = getKing(currentPlayer);
    Rook rook = getRook(side);
    
    if (side == CastleSide.KINGSIDE) {
        board.movePiece(myKing.getPosition(), new Position(7, 6));
        board.movePiece(rook.getPosition(), new Position(7, 5));
    } else {
        board.movePiece(myKing.getPosition(), new Position(7, 2));
        board.movePiece(rook.getPosition(), new Position(7, 3));
    }
}
```

**Q4: What data structures would you use for efficient move generation?**

**Answer**:
```
Naive approach: Brute force
- For each piece, check all 64 squares
- O(pieces * 64) = O(64 * 64) per call
- Slow for AI (needs millions of calls)

Optimized approach: 

1. Use bitboards (64-bit integer per board aspect)
   - Occupied squares: 1 bit per square
   - White pieces: 1 bit per square
   - Rooks: 1 bit per square
   - Bit operations are instant (O(1))
   
2. Pre-computed attack tables
   - For each square and piece type, pre-compute all attacks
   - knight_attacks[square] = all squares knight can attack from that position
   - bishop_attacks[square] = magic bitboard
   
3. Incremental update
   - After each move, update bitboards affected
   - Don't recalculate from scratch

Performance:
- Naive: 1M positions/second
- Optimized: 100M+ positions/second
```

---

### Vending Machine Q&A

**Q1: How do you ensure you dispense the item BEFORE charging if payment fails?**

**Answer**:
```
This is a critical fail-safe question!

WRONG approach (dispense then charge):
dispenseItem(itemCode);
chargePayment(amount);  // What if this fails?
// Item dispensed but not charged = theft

WRONG approach (charge then dispense):
chargePayment(amount);  // What if machine crashes after?
dispenseItem(itemCode); // Never happens = customer upset

CORRECT approach (two-phase):
// Phase 1: Hold payment (reserve money)
PaymentHandle handle = paymentService.holdPayment(amount);
if (handle == null) {
    return false;  // Payment failed, don't dispense
}

// Phase 2: Dispense (can't fail)
try {
    dispenseItem(itemCode);
    // Phase 3: Commit payment
    paymentService.commitPayment(handle);
    return true;
} catch (DispenseException e) {
    // Dispense failed, refund
    paymentService.refundPayment(handle);
    return false;
}

Alternative using idempotent operations:
// Each operation is idempotent (can be retried safely)
Transaction txn = new Transaction(itemCode, amount);
txn.setState(PAYMENT_PENDING);
txn.charge();  // Safe to retry
txn.setState(PAYMENT_CHARGED);
txn.dispense();  // Safe to retry
txn.setState(DISPENSED);
txn.complete();

// If anything fails, can restart from last successful state
```

**Q2: How do you handle an item getting stuck during dispensing?**

**Answer**:
```
Approach 1: Detect mechanical failure
if (dispenseMechanismStuckTimeout > TIMEOUT_THRESHOLD) {
    paymentService.refundPayment(transaction);
    setMachineState(OUT_OF_SERVICE);
    alertMaintenanceStaff("Item stuck at slot " + itemCode);
    
    // Notify customer
    displayMessage("Item stuck. Your payment has been refunded. " +
                   "Maintenance notified. Sorry for inconvenience.");
}

Approach 2: Partial dispensing
// Some items partially dispensed, some not
List<Item> dispensedItems = dispenseMechanism.tryDispense(quantity);
if (dispensedItems.size() < quantity) {
    // Partial failure
    double refundAmount = calculateRefund(quantity - dispensedItems.size());
    paymentService.refund(refundAmount);
    setMachineState(PARTIAL_FAILURE);
}

Approach 3: Reserve for staff
if (dispenseMechanism.reports STUCK_ITEM) {
    transaction.setState(STUCK);
    transaction.setRefundPending(true);
    // Customer gets refund
    // Staff resolves by clearing jam and resetting
}
```

**Q3: Design the coin return mechanism for change**

**Answer**:
```java
interface CoinDispenser {
    boolean dispenseCoin(CoinDenomination denom, int count);
}

class GreedyChangeDispenser implements CoinDispenser {
    private Map<CoinDenomination, Integer> coinInventory;
    
    public List<CoinDenomination> calculateChange(double amount) {
        List<CoinDenomination> change = new ArrayList<>();
        int cents = (int) (amount * 100);
        
        // Greedy: Use largest denomination first
        for (CoinDenomination denom : CoinDenomination.sortedByValue(DESC)) {
            int coinValue = denom.getValue();
            while (cents >= coinValue && coinInventory.getOrDefault(denom, 0) > 0) {
                change.add(denom);
                cents -= coinValue;
                coinInventory.put(denom, coinInventory.get(denom) - 1);
            }
        }
        
        if (cents > 0) {
            // Cannot make exact change!
            // Return coins we took out
            refundCoins(change);
            throw new InsufficientChangeException();
        }
        
        return change;
    }
    
    public void dispensChange(List<CoinDenomination> coins) {
        try {
            for (CoinDenomination coin : coins) {
                coinDispenser.dispense(coin);
            }
        } catch (DispenserException e) {
            // Stuck coins - alert maintenance
            alertMaintenanceStaff("Change dispenser stuck with 
            denomination " + coins);
        }
    }
}

Handling edge cases:
- Not enough exact change available
- Coin dispenser jammed
- Customer doesn't take coins within timeout
```

---

## Comparison: When to Use Each Design

| System | Pattern Focus | Difficulty | Interview Length |
|--------|---------------|-----------|------------------|
| Parking Lot | Inventory + State | Medium | 45-60 min |
| Chess | Game Rules | Hard | 60-90 min |
| Vending | State Machine | Medium | 45-60 min |
| Hotel Booking | Database + Transactions | Hard | 60-90 min |
| Library System | Inventory + Reservation | Easy | 30-45 min |

---

## Interview Success Checklist

- [ ] Clarify ambiguous requirements (local vs. networked, single user vs. multi)
- [ ] Draw simple entity diagrams before coding
- [ ] Identify design patterns that apply
- [ ] Implement core features completely (not half-implemented)
- [ ] Write clean, readable code (not clever/compact)
- [ ] Handle at least one edge case (payment fails, item stuck, etc.)
- [ ] Discuss scalability for 10x concurrency
- [ ] Ask about follow-up requirements before coding
- [ ] Use meaningful variable names
- [ ] Show error handling (try-catch or null-checks)
