"""Number guessing game - my first Python project!"""

import random


def main():
    print("=" * 40)
    print("  Welcome to the Guessing Game!")
    print("=" * 40)
    print("I'm thinking of a number between 1 and 100.")
    print("Can you guess it in as few tries as possible?\n")

    secret = random.randint(1, 100)
    tries = 0

    while True:
        try:
            guess = int(input("Your guess: "))
        except ValueError:
            print("Please enter a whole number!")
            continue

        tries += 1

        if guess < secret:
            print("Too low! Try again.\n")
        elif guess > secret:
            print("Too high! Try again.\n")
        else:
            print(f"🎉 You got it in {tries} tries!")
            if tries <= 7:
                print("Excellent guessing!")
            else:
                print("You'll get faster with practice!")
            break


if __name__ == "__main__":
    main()
